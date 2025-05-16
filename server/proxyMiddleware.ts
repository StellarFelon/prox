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
    // The target URL comes from the request body
    const targetUrl = req.body.url;
    
    if (!targetUrl) {
      return res.status(400).json({ message: 'No URL provided' });
    }
    
    try {
      // Parse the URL to make sure it's valid
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
    
    // Configure proxy options
    const options = {
      target: targetUrl,
      changeOrigin: true,
      selfHandleResponse: false,
      onProxyReq: (proxyReq: any, req: Request) => {
        // Remove referer if requested
        if (req.body.hideReferer) {
          proxyReq.removeHeader('referer');
          proxyReq.removeHeader('origin');
        }
        
        // Remove cookies if requested
        if (req.body.removeCookies) {
          proxyReq.removeHeader('cookie');
        }
        
        // Fix request body
        if (req.body) {
          fixRequestBody(proxyReq, req);
        }
      },
      onProxyRes: async (proxyRes: any, req: Request) => {
        // Log the proxy request
        await logProxyRequest(
          req, 
          targetUrl, 
          'success', 
          proxyRes.statusCode
        );
        
        // Remove cookies from response if requested
        if (req.body.removeCookies) {
          delete proxyRes.headers['set-cookie'];
        }
      },
      onError: async (err: Error, req: Request, res: Response) => {
        console.error('Proxy error:', err);
        await logProxyRequest(req, targetUrl, 'error');
        res.status(500).json({ message: 'Proxy error', error: err.message });
      }
    };
    
    // Create and apply the proxy middleware
    const proxyMiddleware = createProxyMiddleware(options);
    return proxyMiddleware(req, res, next);
  };
};
