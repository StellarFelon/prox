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
      const hideReferer = req.method === 'GET' 
        ? req.query.hideReferer === 'true' 
        : req.body.hideReferer === true;
      const removeCookies = req.method === 'GET' 
        ? req.query.removeCookies === 'true' 
        : req.body.removeCookies === true;
      
      if (!targetUrl) {
        return res.status(400).json({ message: 'No URL provided' });
      }
      
      // Parse the URL to make sure it's valid
      const parsedUrl = new URL(targetUrl);
      
      // Check if the visitor is blocked
      const blocked = await isVisitorBlocked(req);
      if (blocked) {
        await logProxyRequest(req, targetUrl, 'blocked');
        return res.status(403).json({ message: 'Access blocked by administrator' });
      }
      
      // Log successful request before proxying
      await logProxyRequest(req, targetUrl, 'success');

      // For POST requests, redirect to GET with all parameters
      if (req.method === 'POST') {
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
      
      // Only for GET requests, actually proxy the content
      // Configure proxy options
      const options = {
        target: targetUrl,
        changeOrigin: true,
        followRedirects: true,
        secure: true,
        onProxyReq: (proxyReq: any, req: Request) => {
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
          if (removeCookies) {
            delete proxyRes.headers['set-cookie'];
          }
        },
        onError: (err: Error) => {
          console.error('Proxy error:', err);
          res.status(500).json({ message: 'Proxy error', error: err.message });
        }
      };
      
      // Create and apply the proxy middleware
      const proxyMiddleware = createProxyMiddleware(options);
      return proxyMiddleware(req, res, next);
    } catch (error) {
      console.error('Proxy handler error:', error);
      return res.status(500).json({ 
        message: 'Proxy error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
};
