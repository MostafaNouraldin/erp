
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env.local. This should be your MAIN database for tenants and users.');
}

// Main connection for system-level operations (e.g., fetching tenant info)
const mainClient = postgres(process.env.DATABASE_URL);
export const mainDb = drizzle(mainClient, { schema });


// Store tenant connections to reuse them
const tenantConnections = new Map<string, ReturnType<typeof drizzle>>();

/**
 * Connects to a specific tenant's database.
 * In a real-world scenario, this function would look up the tenant's specific
 * database connection string from a secure source (e.g., a central 'main' database or a secret manager).
 * 
 * For this simulation, we'll construct the connection string based on the tenantId
 * and a base DATABASE_URL from environment variables.
 * 
 * Example:
 * If DATABASE_URL is "postgres://user:pass@host:port/main_db"
 * and tenantId is "T001", it will try to connect to "postgres://user:pass@host:port/tenant_T001".
 * The "main" tenantId connects to the main database.
 * 
 * DEVELOPMENT OVERRIDE:
 * If USE_MAIN_DB_FOR_TENANTS is set to 'true' in .env.local, this function will
 * ALWAYS return the main database connection, regardless of the tenantId. This
 * simplifies development and single-tenant setups.
 * 
 * @param tenantId The ID of the tenant.
 * @returns A Drizzle instance connected to the tenant's database.
 */
export async function connectToTenantDb(tenantId: string) {
  // --- DEVELOPMENT OVERRIDE ---
  if (process.env.USE_MAIN_DB_FOR_TENANTS === 'true') {
    return { db: mainDb };
  }
  // --- END OVERRIDE ---

  if (tenantId === 'main') {
    return { db: mainDb };
  }

  if (tenantConnections.has(tenantId)) {
    return { db: tenantConnections.get(tenantId)! };
  }

  // --- THIS IS A SIMPLIFIED LOGIC FOR DEMONSTRATION ---
  // In a production app, you would fetch a full, unique connection string for the tenant.
  const baseUrl = process.env.DATABASE_URL!;
  const url = new URL(baseUrl);
  const tenantDbName = `tenant_${tenantId}`;
  url.pathname = `/${tenantDbName}`;
  const tenantConnectionString = url.toString();
  // --- END OF SIMPLIFIED LOGIC ---

  try {
    const tenantClient = postgres(tenantConnectionString);
    const db = drizzle(tenantClient, { schema });
    tenantConnections.set(tenantId, db);
    return { db };
  } catch (error) {
    console.error(`Failed to connect to database for tenant ${tenantId}:`, error);
    throw new Error(`Could not establish database connection for tenant ${tenantId}.`);
  }
}
