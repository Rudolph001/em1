import { config } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

// Load environment variables from .env file
config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = process.env.DATABASE_URL;

// Determine database type and create appropriate connection
let db: any;
let pool: any = null;

if (databaseUrl.startsWith('file:') || databaseUrl.endsWith('.db')) {
  // SQLite database for local development
  const dbPath = databaseUrl.replace('file:', '');
  const sqlite = new Database(dbPath);
  db = drizzleSQLite(sqlite, { schema });
  console.log(`Connected to SQLite database: ${dbPath}`);
} else {
  // PostgreSQL/Neon database for production
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzleNeon({ client: pool, schema });
  console.log('Connected to PostgreSQL database');
}

export { db, pool };