import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './local.db',
  },
  verbose: true,
  strict: true,
});