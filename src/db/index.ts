
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const mainDatabaseUrl = process.env.DATABASE_URL;

if (!mainDatabaseUrl) {
  console.warn("WARNING: DATABASE_URL is not set. Using a placeholder value. This is critical for multi-tenancy to function.");
  throw new Error("DATABASE_URL environment variable is not set.");
}

// This is a cache for database connections
const connectionCache: { [key: string]: postgres.Sql } = {};

/**
 * Dynamically connects to a tenant's database.
 * Assumes a convention where the database name or other connection parameters
 * are derived from the tenantId. For Supabase, this often means using different passwords
 * for the same host and user, which can be stored in environment variables like `DB_PASSWORD_T001`.
 * 
 * @param tenantId The ID of the tenant. If not provided, connects to the main database.
 * @returns A Drizzle instance connected to the specified tenant's database.
 */
export async function connectToTenantDb(tenantId?: string) {
  const effectiveTenantId = tenantId || 'main';

  if (connectionCache[effectiveTenantId]) {
    return { db: drizzle(connectionCache[effectiveTenantId], { schema }) };
  }

  let connectionString: string;
  const url = new URL(mainDatabaseUrl);

  if (effectiveTenantId === 'main') {
    // Main connection for system-wide data (tenants, roles, etc.)
    connectionString = mainDatabaseUrl;
  } else {
    // For a specific tenant, we construct a unique connection string.
    // This example modifies the password, assuming a convention like `DB_PASSWORD_T001`.
    // A more robust solution might use a service to look up connection strings.
    const tenantPassword = process.env[`DB_PASSWORD_${tenantId}`];
    if (!tenantPassword) {
      // Fallback for development if specific tenant DB isn't set up.
      // In production, you might want this to throw an error.
      console.warn(`WARNING: Password for tenant ${tenantId} not found (DB_PASSWORD_${tenantId}). Falling back to main DB.`);
      connectionString = mainDatabaseUrl;
    } else {
      url.password = tenantPassword;
      connectionString = url.toString();
    }
  }

  console.log(`Connecting to database for tenant: ${effectiveTenantId}`);
  const newConnection = postgres(connectionString);
  connectionCache[effectiveTenantId] = newConnection;

  const db = drizzle(newConnection, { schema });
  
  return { db };
}
