
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env.local. This should be your MAIN database URL from Supabase.');
}

// A single, global connection client for the entire application.
const connection = postgres(process.env.DATABASE_URL);

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
