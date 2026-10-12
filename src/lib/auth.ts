import { createHmac, timingSafeEqual } from "crypto";

export const PO_COOKIE = "atrium_po";

const isProd = process.env.NODE_ENV === "production";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const DEFAULT_SECRET = "atrium-local-secret-rotate-in-production";
const DEFAULT_CODE = "ATRIUM-2026";

const SECRET = process.env.PRIVATE_OFFICE_SECRET ?? DEFAULT_SECRET;
/** Demo access code. Override with PRIVATE_OFFICE_CODE in production. */
export const ACCESS_CODE = process.env.PRIVATE_OFFICE_CODE ?? DEFAULT_CODE;

// A known default secret lets anyone forge Private Office sessions — refuse
// it at runtime in production (the build phase only imports this module).
if (isProd && !isBuildPhase && SECRET === DEFAULT_SECRET) {
  throw new Error(
    "PRIVATE_OFFICE_SECRET is required in production. Generate one with: openssl rand -base64 32"
  );
}
if (isProd && ACCESS_CODE === DEFAULT_CODE) {
  console.warn(
    "[auth] PRIVATE_OFFICE_CODE is using the built-in demo value — set a unique code in production."
  );
}
export const SESSION_SECONDS = 60 * 60 * 8;

function b64(input: string) {
  return Buffer.from(input).toString("base64url");
}

function mac(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function signSession(email: string): string {
  const payload = b64(JSON.stringify({ e: email, x: Date.now() + SESSION_SECONDS * 1000 }));
  return `${payload}.${mac(payload)}`;
}

export function verifySession(token: string | undefined): { email: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = mac(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e: string; x: number };
    if (typeof data.x !== "number" || data.x < Date.now()) return null;
    return { email: data.e };
  } catch {
    return null;
  }
}

export function codeMatches(input: string): boolean {
  const a = Buffer.from(input.trim().toUpperCase());
  const b = Buffer.from(ACCESS_CODE.toUpperCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

const attempts = new Map<string, { n: number; t: number }>();

export function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.t > 10 * 60 * 1000) return false;
  return rec.n >= 6;
}

export function recordFailure(key: string) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.t > 10 * 60 * 1000) attempts.set(key, { n: 1, t: now });
  else rec.n += 1;
}

export function clearFailures(key: string) {
  attempts.delete(key);
}
