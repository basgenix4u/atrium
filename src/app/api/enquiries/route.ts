import { NextResponse } from "next/server";
import { db } from "@/db";
import { enquiries } from "@/db/schema";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const KINDS = new Set(["viewing", "consultation", "information", "acquisition"]);

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
  const kind = clip(body.kind, 30);
  if (name.length < 2) return NextResponse.json({ ok: false, error: "Please tell us your name." }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  const propertyId = typeof body.propertyId === "number" && Number.isInteger(body.propertyId) ? body.propertyId : null;
  try {
    await db.insert(enquiries).values({
      propertyId,
      kind: KINDS.has(kind) ? kind : "viewing",
      name,
      email,
      phone: clip(body.phone, 40) || null,
      preferredDate: clip(body.preferredDate, 60) || null,
      message: clip(body.message, 2000) || null,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "We could not record your enquiry. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
