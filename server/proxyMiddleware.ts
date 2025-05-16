import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';
import { URL } from 'url';
import { storage } from './storage';
import * as zlib from 'zlib'; // Added for handling compressed responses

// Helper to extract visitor info from request
export const extractVisitorInfo = (req: Request) => {
  const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
  const fingerprint = req.headers['x-fingerprint'] as string | undefined;
  const userAgent = req.headers['user-agent'] as string | undefined;

  return { ipAddress, fingerprint, userAgent };
};

// Check if a visitor is blocked
export const isVisitorBlocked = async (req: Request): Promise<boolean> => {
  const { ipAddress, fingerprint } = extractVisitorInfo(req);
  const visitor = await storage.getVisitorByIpAndFingerprint(ipAddress, fingerprint);

  if (!visitor) return false;

  // Update last seen timestamp for the visitor
  await storage.updateVisitorLastSeen(visitor.id);

  return visitor.blocked;
};

// Log a proxy request
export const logProxyRequest = async (
  req: Request, 
  targetUrl: string, 
  status: string, 
  responseStatus?: number
) => {
  try {
    const { ipAddress, fingerprint, userAgent } = extractVisitorInfo(req);

    // Find or create visitor
    let visitor = await storage.getVisitorByIpAndFingerprint(ipAddress, fingerprint);

    if (!visitor) {
      visitor = await storage.createVisitor({
        ipAddress,
        fingerprint,
        userAgent
      });
    } else {
      await storage.updateVisitorLastSeen(visitor.id);
    }

    // Log the proxy request
    await storage.createProxyRequest({
      visitorId: visitor.id,
      url: targetUrl,
      status,
      responseStatus,
      hideReferer: req.body.hideReferer === true || false,
      removeCookies: req.body.removeCookies === true || false,
      headers: req.headers as any
    });
  } catch (error) {
    console.error('Error logging proxy request:', error);
  }
};

// Create proxy middleware generator
export const createProxyHandler = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the target URL from either query parameters (GET) or request body (POST)
      let targetUrl = req.method === 'GET' ? req.query.url as string : req.body.url;

      if (!targetUrl) {
        return res.status(400).json({ message: 'No URL provided' });
      }

      try {
        // Validate URL format
        new URL(targetUrl);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid URL format' });
      }

      // Check if the visitor is blocked
      const blocked = await isVisitorBlocked(req);
      if (blocked) {
        await logProxyRequest(req, targetUrl, 'blocked');
        return res.status(403).json({ message: 'Access blocked by administrator' });
      }

      // Get proxy options from query parameters or request body
      const hideReferer = req.method === 'GET' 
        ? req.query.hideReferer === 'true' 
        : req.body.hideReferer === true;

      const removeCookiesOption = req.method === 'GET' 
        ? req.query.removeCookies === 'true' 
        : req.body.removeCookies === true;

      // For POST requests, return URL to redirect to
      if (req.method === 'POST') {
        // Log the request and any form inputs
        await logProxyRequest(req, targetUrl, 'success');

        // Track form inputs if present
        if (req.body && typeof req.body === 'object') {
          const { ipAddress, fingerprint } = extractVisitorInfo(req);
          const visitor = await storage.getVisitorByIpAndFingerprint(ipAddress, fingerprint);
          if (visitor) {
            // Log all form fields
            Object.entries(req.body).forEach(async ([key, value]) => {
              // Avoid logging the URL itself if it was part of the form body for some reason
              if (key !== 'url' && typeof value === 'string') {
                await storage.logUserInput(visitor.id, value);
              }
            });
          }
        }

        // Build the URL for client-side redirect
        const params = new URLSearchParams();
        params.append('url', targetUrl);
        if (hideReferer) params.append('hideReferer', 'true');
        if (removeCookiesOption) params.append('removeCookies', 'true');

        return res.json({ 
          success: true, 
          message: 'Proxy request successful',
          url: `/api/proxy?${params.toString()}`
        });
      }

      // For GET requests, create a proxy middleware
      // Log the request first
      await logProxyRequest(req, targetUrl, 'success');

      const targetObj = new URL(targetUrl); // Parse the target URL

      // Setup proxy options
      const options = {
        target: `${targetObj.protocol}//${targetObj.host}`, // e.g., https://google.com
        changeOrigin: true,
        selfHandleResponse: true, // Important: We will handle the response stream
        followRedirects: true,
        secure: false, // Allow insecure SSL certificates for proxy
        ws: false, // Don't proxy websockets
        logLevel: 'error' as const,
        pathRewrite: (path: string, req: Request) => {
          const actualTargetUrlString = req.query.url as string;
          if (!actualTargetUrlString) {
            // Fallback for safety, though req.query.url should exist for GET /api/proxy requests
            const originalTargetObj = new URL(targetUrl); 
            return originalTargetObj.pathname + (originalTargetObj.search || '');
          }
          
          const actualTargetObj = new URL(actualTargetUrlString);
          return actualTargetObj.pathname + (actualTargetObj.search || '');
        },
        onProxyReq: (proxyReq: any, req: Request, res: Response) => {
          // Remove referer if requested
          if (hideReferer) {
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('origin');
          }

          // Remove cookies if requested
          if (removeCookiesOption) {
            proxyReq.removeHeader('cookie');
          }
        },
        onProxyRes: (proxyRes: any, req: Request, res: Response) => {
          const sourceOrigin = `${targetObj.protocol}//${targetObj.host}`; 
          const proxyBaseUrl = `${req.protocol}://${req.get('host')}/api/proxy?url=`;

          // Handle redirects
          if (proxyRes.headers['location']) {
            let newLocation = proxyRes.headers['location'];
            try {
                const redirectedUrl = new URL(newLocation, sourceOrigin); // Resolve relative redirects
                newLocation = `${proxyBaseUrl}${encodeURIComponent(redirectedUrl.href)}`;
            } catch (e) {
                // If it's not a valid relative URL or already absolute to a different domain
                if (newLocation.startsWith('/')) { // Relative to current host
                     newLocation = `${proxyBaseUrl}${encodeURIComponent(sourceOrigin + newLocation)}`;
                } else if (!newLocation.match(/^(?:[a-z]+:)?\/\//i)) {
                    // Not starting with / and not a full URL, likely a path segment relative to current path
                    // This case might need more sophisticated handling depending on how `targetUrl` is structured
                    // For now, assume it can be appended to sourceOrigin if it's not absolute.
                    newLocation = `${proxyBaseUrl}${encodeURIComponent(new URL(newLocation, targetUrl).href)}`;
                }
                // If it was already an absolute URL to a different domain, it's left as is (or could be blocked)
            }
            proxyRes.headers['location'] = newLocation;
          }
          
          if (removeCookiesOption && proxyRes.headers['set-cookie']) {
            delete proxyRes.headers['set-cookie'];
          }
          
          const contentType = proxyRes.headers['content-type'];
          const isHtml = contentType && contentType.includes('text/html');
          const isCss = contentType && contentType.includes('text/css');
          const isJs = contentType && (contentType.includes('application/javascript') || contentType.includes('text/javascript'));

          if (isHtml || isCss || isJs) {
            let bodyChunks: Buffer[] = [];
            proxyRes.on('data', (chunk: Buffer) => {
              bodyChunks.push(chunk);
            });

            proxyRes.on('end', async () => {
              let bodyContent = Buffer.concat(bodyChunks);
              const contentEncoding = proxyRes.headers['content-encoding'];

              try {
                if (contentEncoding === 'gzip') {
                  bodyContent = zlib.gunzipSync(bodyContent as any);
                } else if (contentEncoding === 'deflate') {
                  bodyContent = zlib.inflateSync(bodyContent as any);
                } else if (contentEncoding === 'br') {
                  bodyContent = zlib.brotliDecompressSync(bodyContent as any);
                }

                let charset = 'utf-8'; // Default
                if (contentType) {
                    const charsetMatch = contentType.match(/charset=([^;\s]+)/i);
                    if (charsetMatch && charsetMatch[1]) {
                        try {
                            Buffer.from('', charsetMatch[1].trim() as BufferEncoding); // Test if encoding is valid
                            charset = charsetMatch[1].trim();
                        } catch (e) {
                            console.warn(`Invalid charset ${charsetMatch[1]} detected, falling back to utf-8.`);
                        }
                    }
                }
                let responseString = bodyContent.toString(charset as BufferEncoding);
                
                // Regex to find common URL attributes. 
                // Handles src, href, action in HTML; url() in CSS.
                // Avoids absolute URLs (http/https), data URIs, mailto, #fragments, and // (protocol-relative URLs).
                const urlPattern = /(?:(src|href|action)\s*=\s*(?:(['"`]))|url\s*\(\s*(?:(['"`]?)))(?!data:|mailto:|#|javascript:|about:|(?:[a-zA-Z]+:)?\/\/)((?:[^\s'"`()]*\/?)*?)(?:\2|\3\s*\))/gi;
                
                responseString = responseString.replace(urlPattern, (match, attr, htmlQuote, cssQuote, relativeUrl) => {
                  if (!relativeUrl) return match; // Should not happen with this regex if it matched

                  const absoluteAssetUrl = new URL(relativeUrl, targetUrl).href; 
                  const newProxiedUrl = `${proxyBaseUrl}${encodeURIComponent(absoluteAssetUrl)}`;

                  if (attr) { // HTML attribute like src, href, action
                      return `${attr}=${htmlQuote}${newProxiedUrl}${htmlQuote}`;
                  } else { // CSS url()
                      return `url(${cssQuote || ''}${newProxiedUrl}${cssQuote || ''})`;
                  }
                });

                // For HTML, also consider rewriting srcset
                if (isHtml) {
                    const srcsetPattern = /(srcset\s*=\s*)(['"`])(.*?)(\2)/gi;
                    responseString = responseString.replace(srcsetPattern, (match, p1, quote, srcsetValue, p4_unused) => {
                        const newSrcsetEntries = srcsetValue.split(',').map((entry: string) => {
                            const parts = entry.trim().split(/\s+/);
                            if (parts.length > 0 && !(parts[0].startsWith('data:') || parts[0].match(/^(?:[a-z]+:)?\/\//i))) {
                                const absoluteAssetUrl = new URL(parts[0], targetUrl).href;
                                parts[0] = `${proxyBaseUrl}${encodeURIComponent(absoluteAssetUrl)}`;
                                return parts.join(' ');
                            }
                            return entry;
                        }).join(', ');
                        return `${p1}${newSrcsetEntries}${quote}`;
                    });
                }
                
                res.setHeader('Content-Type', contentType); // Ensure original content type (potentially with corrected charset)
                const newBodyBuffer = Buffer.from(responseString, charset as BufferEncoding);
                res.setHeader('Content-Length', newBodyBuffer.length.toString());
                res.removeHeader('Content-Encoding');
                res.removeHeader('Transfer-Encoding');

                res.status(proxyRes.statusCode).end(newBodyBuffer);
              } catch (err) {
                console.error("Error processing/rewriting proxy response:", err);
                // If error, try to send original headers and pipe original body if possible, or send error
                Object.keys(proxyRes.headers).forEach(key => res.setHeader(key, proxyRes.headers[key]));
                res.status(proxyRes.statusCode);
                proxyRes.pipe(res).on('error', () => res.status(500).end("Error processing proxied response"));
              }
            });
          } else {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
          }
        },
        onError: (err: Error, req: Request, res: Response) => {
          console.error('Proxy error:', err);
          logProxyRequest(req, targetUrl, 'error').catch(e => {
            console.error('Error logging failed proxy request:', e);
          });

          // Check if headers have already been sent before trying to write a JSON error
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              message: 'Proxy error', 
              error: err.message 
            }));
          } else {
            res.end();
          }
        }
      };

      createProxyMiddleware(options)(req, res, next);
    } catch (error) {
      console.error('Proxy handler error:', error);
      // Check if headers have already been sent
      if (!(error instanceof Error && res.headersSent)) {
         return res.status(500).json({ 
          message: 'Proxy error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  };
};