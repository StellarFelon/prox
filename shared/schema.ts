import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (extended from the original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Admin table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  lastLogin: timestamp("last_login"),
});

// Visitor tracking table
export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  fingerprint: text("fingerprint"),
  userAgent: text("user_agent"),
  blocked: boolean("blocked").notNull().default(false),
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

// Proxy request logs
export const proxyRequests = pgTable("proxy_requests", {
  id: serial("id").primaryKey(),
  visitorId: integer("visitor_id").references(() => visitors.id),
  url: text("url").notNull(),
  status: text("status").notNull(),
  responseStatus: integer("response_status"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  hideReferer: boolean("hide_referer").notNull().default(false),
  removeCookies: boolean("remove_cookies").notNull().default(false),
  headers: jsonb("headers"),
});

// System settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertAdminSchema = createInsertSchema(admins).pick({
  username: true,
  password: true,
  email: true,
});

export const insertVisitorSchema = createInsertSchema(visitors).pick({
  ipAddress: true,
  fingerprint: true,
  userAgent: true,
});

export const insertProxyRequestSchema = createInsertSchema(proxyRequests).pick({
  visitorId: true,
  url: true,
  status: true,
  responseStatus: true,
  hideReferer: true,
  removeCookies: true,
  headers: true,
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
  description: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = typeof visitors.$inferSelect;

export type InsertProxyRequest = z.infer<typeof insertProxyRequestSchema>;
export type ProxyRequest = typeof proxyRequests.$inferSelect;

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
