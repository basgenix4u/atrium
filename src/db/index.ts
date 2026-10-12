import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

/**
 * This module is imported by the home page and API routes, so it must never
 * throw at import time (including during `next build`, when env vars may not
 * exist yet). Without DATABASE_URL the pool points at an unroutable local
 * address: every query fails fast with a connection error, and callers
 * already handle that — the landing page falls back to built-in seed data,
 * enquiry/access-request routes return a friendly 500, and /api/health
 * reports ok:false. Configure DATABASE_URL to enable persistence.
 */
if (!databaseUrl) {
  console.warn(
    "[db] DATABASE_URL is not set — using built-in seed data for the landing page; " +
      "enquiries, access requests and /api/health are unavailable until it is configured."
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl ?? "postgresql://127.0.0.1:1/atrium_unavailable",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
