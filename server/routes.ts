import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createProxyHandler, extractVisitorInfo } from "./proxyMiddleware";
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { z } from 'zod';
import connectSqlite3 from 'connect-sqlite3';

// Extend session interface to include our custom properties
declare module 'express-session' {
  interface SessionData {
    adminId?: number;
    username?: string;
  }
}

const SQLiteStore = connectSqlite3(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  const sessionStore = new SQLiteStore({
    dir: './db', // Directory to store session files
    db: 'sessions.sqlite', // Session database filename
    table: 'sessions' // Optional: table name, defaults to 'sessions'
  });

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'proxy-guard-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Create API routes
  const apiRouter = express.Router();

  // Middleware to track visitors
  apiRouter.use(async (req, res, next) => {
    try {
      const { ipAddress, fingerprint, userAgent } = extractVisitorInfo(req);
      
      // Find or create visitor
      const visitor = await storage.getVisitorByIpAndFingerprint(ipAddress, fingerprint);
      
      if (visitor) {
        // Update last seen
        await storage.updateVisitorLastSeen(visitor.id);
        
        // Check if blocked
        if (visitor.blocked && !req.path.startsWith('/admin')) {
          return res.status(403).json({ message: 'Access blocked by administrator' });
        }
      } else {
        // Create new visitor
        await storage.createVisitor({
          ipAddress,
          fingerprint,
          userAgent
        });
      }
      next();
    } catch (error) {
      console.error('Error tracking visitor:', error);
      next();
    }
  });

  // Proxy routes - support both GET and POST
  apiRouter.post('/proxy', createProxyHandler());
  apiRouter.get('/proxy', createProxyHandler());

  // Auth routes
  apiRouter.post('/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Find admin
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Set session
      req.session.adminId = admin.id;
      req.session.username = admin.username;
      
      // Update last login
      await storage.updateAdminLastLogin(admin.id);
      
      return res.json({ 
        message: 'Login successful',
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  apiRouter.post('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logout successful' });
    });
  });

  // Admin check
  apiRouter.get('/admin/check', (req, res) => {
    if (req.session.adminId) {
      return res.json({ 
        isAdmin: true, 
        username: req.session.username 
      });
    }
    return res.json({ isAdmin: false });
  });

  // Admin routes - protected by middleware
  const adminMiddleware = (req: Request, res: Response, next: any) => {
    if (!req.session.adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };

  // Dashboard stats
  apiRouter.get('/admin/stats', adminMiddleware, async (req, res) => {
    try {
      const totalRequests = await storage.countProxyRequests();
      const activeUsers = await storage.getActiveVisitors(5); // Users active in last 5 minutes
      const blockedAttempts = await storage.countBlockedRequests(24); // Blocked in last 24 hours
      
      return res.json({
        totalRequests,
        activeUsers,
        blockedAttempts
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Recent activity
  apiRouter.get('/admin/recent-activity', adminMiddleware, async (req, res) => {
    try {
      const recentRequests = await storage.getRecentProxyRequests(20);
      return res.json(recentRequests);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return res.status(500).json({ message: 'Failed to fetch recent activity' });
    }
  });

  // User management
  apiRouter.get('/admin/visitors', adminMiddleware, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      const visitors = await storage.getAllVisitors(page, pageSize);
      const total = await storage.countVisitors();
      
      return res.json({
        visitors,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      console.error('Error fetching visitors:', error);
      return res.status(500).json({ message: 'Failed to fetch visitors' });
    }
  });

  // Block/unblock visitor
  apiRouter.put('/admin/visitors/:id/block', adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { blocked } = req.body;
      
      if (typeof blocked !== 'boolean') {
        return res.status(400).json({ message: 'Blocked status must be a boolean' });
      }
      
      const visitor = await storage.updateVisitorBlockStatus(id, blocked);
      if (!visitor) {
        return res.status(404).json({ message: 'Visitor not found' });
      }
      
      return res.json(visitor);
    } catch (error) {
      console.error('Error updating visitor block status:', error);
      return res.status(500).json({ message: 'Failed to update visitor' });
    }
  });

  // Settings management
  apiRouter.get('/admin/settings', adminMiddleware, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      return res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  apiRouter.put('/admin/settings/:key', adminMiddleware, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: 'Setting value is required' });
      }
      
      const setting = await storage.updateSetting(key, value);
      return res.json(setting);
    } catch (error) {
      console.error('Error updating setting:', error);
      return res.status(500).json({ message: 'Failed to update setting' });
    }
  });

  // Add initial admin user if none exists (on startup)
  async function setupDefaultAdmin() {
    try {
      const defaultAdmin = await storage.getAdminByUsername('admin');
      
      if (!defaultAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await storage.createAdmin({
          username: 'admin',
          password: hashedPassword,
          email: 'admin@proxyguard.com'
        });
        console.log('Created default admin user');
      }
    } catch (error) {
      console.error('Error setting up default admin:', error);
    }
  }

  // Setup default settings if they don't exist
  async function setupDefaultSettings() {
    try {
      const defaultSettings = [
        { key: 'proxyLocation', value: 'auto', description: 'Proxy server location' },
        { key: 'connectionTimeout', value: '30', description: 'Connection timeout in seconds' },
        { key: 'enableHttpsRedirect', value: 'true', description: 'Redirect HTTP to HTTPS' },
        { key: 'blockMaliciousContent', value: 'true', description: 'Block known malicious content' }
      ];
      
      for (const setting of defaultSettings) {
        const existingSetting = await storage.getSetting(setting.key);
        if (!existingSetting) {
          await storage.updateSetting(setting.key, setting.value);
        }
      }
    } catch (error) {
      console.error('Error setting up default settings:', error);
    }
  }

  // Initialize database with defaults
  setupDefaultAdmin();
  setupDefaultSettings();

  // Register the API routes
  app.use('/api', apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
