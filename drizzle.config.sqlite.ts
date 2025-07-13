import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle-sqlite',
  dialect: 'sqlite',
  dbCredentials: {
    url: './euromillions.db',
  },
  verbose: true,
  strict: true,
});