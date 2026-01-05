
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const mainDatabaseUrl = process.env.DATABASE_URL;

if (!mainDatabaseUrl) {
  console.error("CRITICAL: DATABASE_URL is not set.");
  throw new Error("DATABASE_URL environment variable is not set.");
}

// Extend the global type to include our custom client property
declare global {
  // eslint-disable-next-line no-var
  var postgresClient: Sql | undefined;
}

let client: Sql;

// This is the correct pattern for managing DB connections in a serverless/edge environment like Vercel with Next.js.
// We cache the connection on `globalThis` to avoid creating a new connection on every hot-reload in development.
if (process.env.NODE_ENV === 'production') {
  client = postgres(mainDatabaseUrl);
} else {
  if (!globalThis.postgresClient) {
    globalThis.postgresClient = postgres(mainDatabaseUrl);
  }
  client = globalThis.postgresClient;
}

const db = drizzle(client, { schema });

/**
 * Connects to the tenant's database. In our single-DB architecture, this
 * simply returns the main database connection.
 * @param tenantId - The ID of the tenant (currently unused in this architecture).
 * @returns An object containing the Drizzle instance.
 */
export async function connectToTenantDb(tenantId?: string | null) {
  // In our current single-DB architecture, we don't need to switch connections.
  // We simply return the globally managed Drizzle instance.
  // The postgres.js driver handles connection pooling automatically.
  return { db };
}
