
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
  drizzleDb: ReturnType<typeof drizzle> | undefined;
};

// A function that manages a single, shared connection.
export async function connectToTenantDb(_tenantId?: string) {
  if (!globalForDb.conn) {
    console.log("Creating new database connection...");
    globalForDb.conn = postgres(databaseUrl);
  }

  if (!globalForDb.drizzleDb) {
    console.log("Creating new Drizzle instance...");
    globalForDb.drizzleDb = drizzle(globalForDb.conn, { schema });
  }

  return { db: globalForDb.drizzleDb };
}

// Export a mainDb alias for any legacy code that might still use it.
// This will now correctly use the singleton managed by connectToTenantDb.
// Note: Direct usage of this might be less safe if the connection isn't established yet.
// It's better to call `await connectToTenantDb()` everywhere.
// However, we can initialize it once here to be safe.
const { db: mainDb } = await connectToTenantDb();
export { mainDb };
