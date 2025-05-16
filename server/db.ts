import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. It should be the path to your SQLite file (e.g., ./mydb.sqlite)",
  );
}

// For better-sqlite3, DATABASE_URL is the file path. Remove any "sqlite:" prefix.
const dbPath = process.env.DATABASE_URL.startsWith('sqlite:') 
    ? process.env.DATABASE_URL.substring(7) 
    : process.env.DATABASE_URL;

let sqlite;
try {
  sqlite = new Database(dbPath);
  // console.log("Connected to SQLite database at", dbPath);
} catch (err) {
  console.error("Failed to connect to SQLite:", (err as Error).message);
  throw err;
}

export const db = drizzle(sqlite, { schema });
