import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

/**
 * `next build` (e.g. on Vercel) imports route modules to collect metadata,
 * which evaluates this module at BUILD time — before project env vars are
 * guaranteed to exist. The check is therefore strict at RUNTIME but
 * tolerant during the build phase; a missing DATABASE_URL fails the
 * deployed app loudly on first query instead of breaking the build.
 */
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (!databaseUrl && !isBuildPhase) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// During the build phase without DATABASE_URL the pool is a placeholder —
// route modules are imported but never executed, so no query ever runs.
export const pool = databaseUrl
  ? (globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    }))
  : (undefined as unknown as Pool);

if (databaseUrl && process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
