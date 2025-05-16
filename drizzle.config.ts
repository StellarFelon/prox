import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. For SQLite, this is the path to your database file (e.g., ./mydb.sqlite).");
}

// Ensure DATABASE_URL is just the path for the sqlite driver
const dbPath = process.env.DATABASE_URL.startsWith('sqlite:') 
    ? process.env.DATABASE_URL.substring(7) 
    : process.env.DATABASE_URL;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
