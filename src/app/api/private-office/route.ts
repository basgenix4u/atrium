import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  PO_COOKIE,
  SESSION_SECONDS,
  clearFailures,
  codeMatches,
  recordFailure,
  signSession,
  tooManyAttempts,
  verifySession,
} from "@/lib/auth";
import { loadAllProperties, splitProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns the off-market portfolio only when the session cookie is valid. */
export async function GET() {
  const jar = await cookies();
  const session = verifySession(jar.get(PO_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { priv } = splitProperties(await loadAllProperties());
  return NextResponse.json({ ok: true, email: session.email, properties: priv });
}

export async function POST(req: Request) {
  let body: { email?: unknown; code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code : "";
  if (!EMAIL.test(email) || email.length > 200) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }
  const key = email;
  if (tooManyAttempts(key)) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Please try again in ten minutes." }, { status: 429 });
  }
  if (!codeMatches(code)) {
    recordFailure(key);
    return NextResponse.json({ ok: false, error: "That access code was not recognised." }, { status: 401 });
  }
  clearFailures(key);
  const jar = await cookies();
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  jar.set(PO_COOKIE, signSession(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  const { priv } = splitProperties(await loadAllProperties());
  return NextResponse.json({ ok: true, email, properties: priv });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(PO_COOKIE);
  return NextResponse.json({ ok: true });
}
