
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const mainDatabaseUrl = process.env.DATABASE_URL;

if (!mainDatabaseUrl) {
  console.error("CRITICAL: DATABASE_URL is not set.");
  throw new Error("DATABASE_URL environment variable is not set.");
}

/**
 * Creates a new Drizzle instance for a given tenant.
 * This function now creates a new connection on each call with a short idle timeout.
 * This pattern is more robust for serverless environments with low connection limits (like free Supabase tiers),
 * as it ensures connections are closed quickly after being used.
 *
 * @param tenantId The ID of the tenant. This is currently unused but kept for API compatibility.
 * @returns A Drizzle instance connected to the database.
 */
export async function connectToTenantDb(tenantId?: string | null) {
  // We will create a new client each time to ensure connections are not held open across invocations
  // in a serverless environment. The `idle_timeout` is crucial for free tiers.
  const client = postgres(mainDatabaseUrl, {
    idle_timeout: 10, // Automatically close idle connections after 10 seconds
    max: 1, // Restrict to a single connection per instance, crucial for Supabase free tier
  });
  
  const db = drizzle(client, { schema });
  return { db };
}
