
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/db';

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Using a placeholder value. Please create a .env.local file with your actual database connection string.");
}

// --- Singleton Pattern for Database Connection ---
// This ensures that in a development environment with hot-reloading,
// we don't create new connections on every reload.
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(databaseUrl);
if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;

const db = drizzle(conn, { schema });
// --- End Singleton Pattern ---


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
