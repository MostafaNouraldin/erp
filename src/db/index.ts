
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

// This approach is tailored for serverless environments with limited connection pooling, like Supabase's free tier.
// It creates a new connection instance on-demand and ensures it closes quickly after being idle.
export async function connectToTenantDb(tenantId?: string | null) {
  const connectionString = mainDatabaseUrl;
  
  // The postgres.js library is efficient. Creating a new instance is cheap.
  // The key is the idle_timeout to ensure connections are closed promptly.
  const client = postgres(connectionString, {
    // max: 1, // Restrict the pool size for this instance.
    idle_timeout: 10, // Seconds until idle connections are closed. Aggressive for free tiers.
    onclose: () => console.log(`Connection for tenant ${tenantId || 'main'} closed.`),
  });

  const db = drizzle(client, { schema });
  
  return { db };
}
