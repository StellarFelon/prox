import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(new Date()),
});

// Admin table
export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  lastLogin: integer("last_login", { mode: "timestamp_ms" }),
});

// Visitor tracking table
export const visitors = sqliteTable("visitors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ipAddress: text("ip_address").notNull(),
  fingerprint: text("fingerprint"),
  userAgent: text("user_agent"),
  blocked: integer("blocked", { mode: "boolean" }).notNull().default(false),
  firstSeen: integer("first_seen", { mode: "timestamp_ms" }).notNull().default(new Date()),
  lastSeen: integer("last_seen", { mode: "timestamp_ms" }).notNull().default(new Date()),
});

// Proxy request logs
export const proxyRequests = sqliteTable("proxy_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: integer("visitor_id").references(() => visitors.id),
  url: text("url").notNull(),
  status: text("status").notNull(),
  responseStatus: integer("response_status"),
  timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull().default(new Date()),
  hideReferer: integer("hide_referer", { mode: "boolean" }).notNull().default(false),
  removeCookies: integer("remove_cookies", { mode: "boolean" }).notNull().default(false),
  headers: text("headers", { mode: "json" }), // Store JSON as text
});

// System settings
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(new Date()),
});

// User inputs table
export const userInputs = sqliteTable("user_inputs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: integer("visitor_id").references(() => visitors.id),
  input: text("input").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull().default(new Date()),
});

// Create insert schemas (These should remain largely the same, but types will be inferred from the new schema)
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

export const insertUserInputSchema = createInsertSchema(userInputs).pick({
    visitorId: true,
    input: true,
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

export type UserInput = typeof userInputs.$inferSelect;
export type InsertUserInput = typeof userInputs.$inferInsert;
