
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// This is the recommended pattern for using `postgres.js` in a Next.js/serverless environment.
// It ensures that a single connection pool is created and reused across lambda invocations.
// See: https://github.com/vercel/next.js/blob/canary/examples/with-drizzle/lib/db.ts
// And: https://github.com/porsager/postgres#connections

declare global {
  // eslint-disable-next-line no-var -- global singleton
  var postgresClient: postgres.Sql | undefined;
}

let client;
const mainDatabaseUrl = process.env.DATABASE_URL;

if (!mainDatabaseUrl) {
  console.error("CRITICAL: DATABASE_URL is not set.");
  throw new Error("DATABASE_URL environment variable is not set.");
}

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
 * Returns the shared Drizzle instance.
 * In this corrected model, we return the single, shared `db` instance which uses a
 * singleton `postgres` client. This avoids creating multiple connection pools.
 *
 * @param tenantId The ID of the tenant. This is currently unused but kept for API compatibility.
 * @returns A Drizzle instance connected to the database.
 */
export async function connectToTenantDb(tenantId?: string | null) {
  return { db };
}
