import { 
  type User, 
  type InsertUser, 
  type Visitor, 
  type InsertVisitor,
  type ProxyRequest,
  type InsertProxyRequest,
  type Admin,
  type InsertAdmin,
  type Setting,
  type InsertSetting,
  users,
  visitors,
  proxyRequests,
  admins,
  settings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Admin methods
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdminLastLogin(id: number): Promise<Admin | undefined>;
  
  // Visitor methods
  getVisitor(id: number): Promise<Visitor | undefined>;
  getVisitorByIpAndFingerprint(ip: string, fingerprint?: string): Promise<Visitor | undefined>;
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  updateVisitorLastSeen(id: number): Promise<Visitor | undefined>;
  updateVisitorBlockStatus(id: number, blocked: boolean): Promise<Visitor | undefined>;
  getAllVisitors(page: number, pageSize: number): Promise<Visitor[]>;
  countVisitors(): Promise<number>;
  getActiveVisitors(timeWindowMinutes: number): Promise<number>;
  
  // Proxy request methods
  createProxyRequest(request: InsertProxyRequest): Promise<ProxyRequest>;
  getRecentProxyRequests(limit: number): Promise<ProxyRequest[]>;
  countProxyRequests(): Promise<number>;
  countBlockedRequests(timeWindowHours: number): Promise<number>;
  
  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Admin methods
  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db
      .insert(admins)
      .values(insertAdmin)
      .returning();
    return admin;
  }

  async updateAdminLastLogin(id: number): Promise<Admin | undefined> {
    const [admin] = await db
      .update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, id))
      .returning();
    return admin;
  }

  // Visitor methods
  async getVisitor(id: number): Promise<Visitor | undefined> {
    const [visitor] = await db.select().from(visitors).where(eq(visitors.id, id));
    return visitor;
  }

  async getVisitorByIpAndFingerprint(ip: string, fingerprint?: string): Promise<Visitor | undefined> {
    const query = fingerprint 
      ? and(eq(visitors.ipAddress, ip), eq(visitors.fingerprint, fingerprint))
      : eq(visitors.ipAddress, ip);
    
    const [visitor] = await db.select().from(visitors).where(query);
    return visitor;
  }

  async createVisitor(insertVisitor: InsertVisitor): Promise<Visitor> {
    const [visitor] = await db
      .insert(visitors)
      .values(insertVisitor)
      .returning();
    return visitor;
  }

  async updateVisitorLastSeen(id: number): Promise<Visitor | undefined> {
    const [visitor] = await db
      .update(visitors)
      .set({ lastSeen: new Date() })
      .where(eq(visitors.id, id))
      .returning();
    return visitor;
  }

  async updateVisitorBlockStatus(id: number, blocked: boolean): Promise<Visitor | undefined> {
    const [visitor] = await db
      .update(visitors)
      .set({ blocked })
      .where(eq(visitors.id, id))
      .returning();
    return visitor;
  }

  async getAllVisitors(page: number, pageSize: number): Promise<Visitor[]> {
    const offset = (page - 1) * pageSize;
    return await db
      .select()
      .from(visitors)
      .orderBy(desc(visitors.lastSeen))
      .limit(pageSize)
      .offset(offset);
  }

  async countVisitors(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(visitors);
    return result.count;
  }

  async getActiveVisitors(timeWindowMinutes: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    const [result] = await db
      .select({ count: count() })
      .from(visitors)
      .where(sql`${visitors.lastSeen} > ${cutoffTime}`);
    
    return result.count;
  }

  // Proxy request methods
  async createProxyRequest(insertRequest: InsertProxyRequest): Promise<ProxyRequest> {
    const [request] = await db
      .insert(proxyRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async getRecentProxyRequests(limit: number): Promise<ProxyRequest[]> {
    return await db
      .select()
      .from(proxyRequests)
      .orderBy(desc(proxyRequests.timestamp))
      .limit(limit);
  }

  async countProxyRequests(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(proxyRequests);
    return result.count;
  }

  async countBlockedRequests(timeWindowHours: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
    
    const [result] = await db
      .select({ count: count() })
      .from(proxyRequests)
      .where(
        and(
          sql`${proxyRequests.timestamp} > ${cutoffTime}`,
          eq(proxyRequests.status, 'blocked')
        )
      );
    
    return result.count;
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    // Try to update first
    const [existingSetting] = await db
      .update(settings)
      .set({ value, updatedAt: new Date() })
      .where(eq(settings.key, key))
      .returning();
    
    if (existingSetting) return existingSetting;
    
    // If not exists, create it
    const [newSetting] = await db
      .insert(settings)
      .values({ key, value })
      .returning();
    
    return newSetting;
  }

  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }
}

export const storage = new DatabaseStorage();
