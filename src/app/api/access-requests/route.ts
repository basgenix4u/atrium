import { NextResponse } from "next/server";
import { db } from "@/db";
import { accessRequests } from "@/db/schema";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const name = clip(body.name, 120);
  const email = clip(body.email, 200).toLowerCase();
  const role = clip(body.role, 80);
  if (name.length < 2) return NextResponse.json({ ok: false, error: "Please tell us your name." }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  if (!role) return NextResponse.json({ ok: false, error: "Please select how you would use Atrium." }, { status: 400 });
  try {
    await db.insert(accessRequests).values({
      name,
      email,
      role,
      budget: clip(body.budget, 60) || null,
      regions: clip(body.regions, 200) || null,
      message: clip(body.message, 2000) || null,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "We could not record your request. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
