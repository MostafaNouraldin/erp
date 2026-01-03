
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Fallback DATABASE_URL for development environments where .env.local might be missing.
// This should be replaced with a proper environment variable in production.
const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/db';

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Using a placeholder value. Please create a .env.local file with your actual database connection string.");
}


// A single, global connection client for the entire application.
const connection = postgres(databaseUrl);

// A single, global Drizzle instance.
const db = drizzle(connection, { schema });

/**
 * Provides a unified database connection.
 * In this simplified setup, it always returns the main database connection.
 * @param _tenantId - The tenant ID (ignored in this setup).
 * @returns A Drizzle instance connected to the database.
 */
export async function connectToTenantDb(_tenantId?: string) {
  return { db };
}

// Export a mainDb alias for any legacy code that might still use it.
export const mainDb = db;
