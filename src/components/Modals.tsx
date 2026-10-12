"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Property } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useAtrium } from "./AtriumProvider";
import { Icon, Logo } from "./Icons";

function Dialog({ open, onClose, labelledBy, children }: { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.body.style.overflow = "hidden";
    }
    if (!open && d.open) d.close();
    return () => {
      if (!open) document.body.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={labelledBy}
      onClose={() => {
        document.body.style.overflow = "";
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open ? children : null}
    </dialog>
  );
}

type Status = "idle" | "sending" | "done" | "error";

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string; [k: string]: unknown }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    return { ...data, ok: !!res.ok && data.ok !== false };
  } catch {
    return { ok: false, error: "Network error. Please check your connection and try again." };
  }
}

const ROLES = ["Principal / UHNW individual", "Family office", "Investment firm / fund", "Luxury broker or agency", "Developer", "Architect or designer", "Design enthusiast"];
const BUDGETS = ["$10M – $25M", "$25M – $50M", "$50M – $100M", "$100M+", "Portfolio mandate"];

export function AccessRequestForm({ dark = false, onDone }: { dark?: boolean; onDone?: () => void }) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const f = `field ${dark ? "field-dark" : ""}`;
  const lab = `grid gap-1.5 text-sm ${dark ? "text-ivory/80" : "text-ink/80"}`;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("sending");
    setError("");
    const res = await post("/api/access-requests", Object.fromEntries(fd.entries()));
    if (res.ok) {
      setStatus("done");
      onDone?.();
    } else {
      setStatus("error");
      setError(res.error ?? "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className={`rounded-3xl p-8 text-center ${dark ? "glass" : "glass-light"}`}>
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-gold/20 text-gold">
          <Icon name="check" className="size-6" />
        </span>
        <h3 className="font-display text-3xl">Your request is with our membership office.</h3>
        <p className={`mx-auto mt-3 max-w-sm text-sm ${dark ? "text-ivory/65" : "text-mute"}`}>
          A senior member of the team will verify your details and reply personally within one business day. Everything you share remains strictly confidential.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={lab} htmlFor={`${id}-n`}>
          Full name
          <input id={`${id}-n`} name="name" required minLength={2} autoComplete="name" className={f} placeholder="Alexandra Reyes" />
        </label>
        <label className={lab} htmlFor={`${id}-e`}>
          Private email
          <input id={`${id}-e`} name="email" type="email" required autoComplete="email" className={f} placeholder="you@family-office.com" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={lab} htmlFor={`${id}-r`}>
          I am a…
          <select id={`${id}-r`} name="role" required defaultValue="" className={f}>
            <option value="" disabled>
              Select your profile
            </option>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className={lab} htmlFor={`${id}-b`}>
          Acquisition range
          <select id={`${id}-b`} name="budget" defaultValue="" className={f}>
            <option value="">Prefer not to say</option>
            {BUDGETS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>
      <label className={lab} htmlFor={`${id}-g`}>
        Regions of interest
        <input id={`${id}-g`} name="regions" className={f} placeholder="e.g. Côte d'Azur, Aspen, Tokyo" />
      </label>
      <label className={lab} htmlFor={`${id}-m`}>
        Anything we should know? <span className="opacity-60">(optional)</span>
        <textarea id={`${id}-m`} name="message" rows={3} className={`${f} resize-none`} placeholder="Timelines, structures, privacy requirements…" />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      <button type="submit" disabled={status === "sending"} className="btn btn-gold mt-1 disabled:opacity-60">
        {status === "sending" ? "Sending securely…" : "Request an invitation"}
        <Icon name="arrow-right" className="size-4" />
      </button>
      <p className={`text-center text-xs ${dark ? "text-ivory/45" : "text-mute"}`}>Reviewed by a human. Never shared, never sold.</p>
    </form>
  );
}

export function PrivateOfficeModal({ open, mode, onMode, onClose }: { open: boolean; mode: "enter" | "request"; onMode: (m: "enter" | "request") => void; onClose: () => void }) {
  const { unlock } = useAtrium();
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  async function enter(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const res = await post("/api/private-office", { email, code });
    if (res.ok && Array.isArray(res.properties)) {
      unlock(email.trim().toLowerCase(), res.properties as Property[]);
      setStatus("done");
      onClose();
      window.setTimeout(() => document.getElementById("private-office")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } else {
      setStatus("error");
      setError(res.error ?? "Unable to open the Private Office.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy={`${id}-title`}>
      <div className="relative w-[min(94vw,34rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-ink-2 p-6 text-ivory shadow-2xl sm:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/20 blur-3xl" />
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-ivory/70 transition hover:bg-white/10 hover:text-ivory">
          <Icon name="close" />
        </button>
        <Logo className="text-gold-soft" />
        <h2 id={`${id}-title`} className="font-display mt-6 text-4xl leading-tight sm:text-[2.6rem]">
          The Private Office
        </h2>
        <p className="mt-2 text-sm text-ivory/60">Off-market estates and confidential opportunities, available to verified principals and their advisors.</p>

        <div role="tablist" aria-label="Private Office access" className="mt-6 grid grid-cols-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
          {(["enter", "request"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => onMode(m)}
              className={`rounded-full px-4 py-2.5 transition ${mode === m ? "bg-gold text-ink" : "text-ivory/70 hover:text-ivory"}`}
            >
              {m === "enter" ? "I have an access code" : "Request access"}
            </button>
          ))}
        </div>

        <div className="mt-6" role="tabpanel">
          {mode === "enter" ? (
            <form onSubmit={enter} className="grid gap-4">
              <label className="grid gap-1.5 text-sm text-ivory/80">
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" className="field field-dark" placeholder="you@family-office.com" />
              </label>
              <label className="grid gap-1.5 text-sm text-ivory/80">
                Access code
                <input value={code} onChange={(e) => setCode(e.target.value)} type="password" required autoComplete="one-time-code" className="field field-dark tracking-widest" placeholder="••••-••••" />
              </label>
              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}
              <button type="submit" disabled={status === "sending"} className="btn btn-gold disabled:opacity-60">
                <Icon name="lock" className="size-4" />
                {status === "sending" ? "Verifying…" : "Enter the Private Office"}
              </button>
              <div className="rounded-2xl border border-gold/25 bg-gold/5 p-4 text-xs leading-relaxed text-ivory/70">
                <strong className="font-medium text-gold-soft">Demo environment.</strong> Use any email with code{" "}
                <button type="button" onClick={() => setCode("ATRIUM-2026")} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-gold-soft underline-offset-2 hover:underline">
                  ATRIUM-2026
                </button>{" "}
                to preview the off-market portfolio.
              </div>
            </form>
          ) : (
            <AccessRequestForm dark />
          )}
        </div>
      </div>
    </Dialog>
  );
}

const KINDS = [
  { v: "viewing", l: "Private viewing" },
  { v: "consultation", l: "Advisory consultation" },
  { v: "information", l: "Full information dossier" },
  { v: "acquisition", l: "Acquisition support" },
];

export function EnquiryModal({ open, propertyId, kind, onClose }: { open: boolean; propertyId: number | null; kind: string; onClose: () => void }) {
  const { properties, active } = useAtrium();
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const prop: Property | undefined = properties.find((p) => p.id === propertyId) ?? (propertyId === null ? undefined : active);

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setError("");
    }
  }, [open]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries());
    setStatus("sending");
    setError("");
    const res = await post("/api/enquiries", { ...fd, propertyId: prop?.id ?? null });
    if (res.ok) setStatus("done");
    else {
      setStatus("error");
      setError(res.error ?? "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy={`${id}-title`}>
      <div className="relative max-h-[92dvh] w-[min(94vw,36rem)] overflow-y-auto rounded-[2rem] bg-ivory p-6 shadow-2xl thin-scroll sm:p-9">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-ink/60 transition hover:bg-ink/10">
          <Icon name="close" />
        </button>
        {status === "done" ? (
          <div role="status" className="py-8 text-center">
            <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-gold/25 text-gold-deep">
              <Icon name="check" className="size-7" />
            </span>
            <h2 id={`${id}-title`} className="font-display text-4xl">
              Thank you — we&apos;ll be in touch.
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-mute">Your private advisor will contact you within the hour during business hours. Your enquiry is confidential.</p>
            <button type="button" onClick={onClose} className="btn btn-dark mt-7">
              Continue exploring
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow text-gold-deep">Discreet enquiry</p>
            <h2 id={`${id}-title`} className="font-display mt-2 text-4xl leading-tight">
              {prop ? prop.name : "Speak with an advisor"}
            </h2>
            {prop && (
              <p className="mt-1 text-sm text-mute">
                {prop.city}, {prop.country} · {formatPrice(prop.price)}
              </p>
            )}
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <label className="grid gap-1.5 text-sm text-ink/80">
                How can we help?
                <select name="kind" defaultValue={kind} className="field">
                  {KINDS.map((k) => (
                    <option key={k.v} value={k.v}>
                      {k.l}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm text-ink/80">
                  Full name
                  <input name="name" required minLength={2} autoComplete="name" className="field" placeholder="Your name" />
                </label>
                <label className="grid gap-1.5 text-sm text-ink/80">
                  Private email
                  <input name="email" type="email" required autoComplete="email" className="field" placeholder="you@example.com" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm text-ink/80">
                  Phone <span className="-mt-1 text-xs opacity-60">(optional)</span>
                  <input name="phone" type="tel" autoComplete="tel" className="field" placeholder="+1 …" />
                </label>
                <label className="grid gap-1.5 text-sm text-ink/80">
                  Preferred date <span className="-mt-1 text-xs opacity-60">(optional)</span>
                  <input name="preferredDate" type="date" className="field" />
                </label>
              </div>
              <label className="grid gap-1.5 text-sm text-ink/80">
                Message
                <textarea name="message" rows={3} className="field resize-none" placeholder="Tell us about your requirements and timeline." />
              </label>
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <button type="submit" disabled={status === "sending"} className="btn btn-dark disabled:opacity-60">
                {status === "sending" ? "Sending…" : "Send confidential enquiry"}
                <Icon name="arrow-right" className="size-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </Dialog>
  );
}
