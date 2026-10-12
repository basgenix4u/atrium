"use client";

import Image from "next/image";

import { formatNumber, formatPrice } from "@/lib/format";
import { useAtrium } from "./AtriumProvider";
import { Icon, type IconName } from "./Icons";
import { Reveal } from "./Reveal";

const FEATURES: { icon: IconName; t: string; d: string }[] = [
  { icon: "lock", t: "Off-market by design", d: "Estates that never reach a portal or a hoarding." },
  { icon: "pin", t: "Exact coordinates", d: "Revealed only inside an authenticated session." },
  { icon: "shield", t: "Verified principals", d: "Every member is vetted by a human." },
  { icon: "key", t: "Discreet introductions", d: "Viewings arranged through your advisor alone." },
];

export function PrivateOffice() {
  const { teasers, unlocked, email, properties, openAccess, openStudio, lock } = useAtrium();
  const priv = properties.filter((p) => p.offMarket);

  return (
    <section id="private-office" aria-labelledby="po-title" className="grain relative isolate overflow-hidden bg-ink-2 py-24 text-ivory sm:py-32">
      <div aria-hidden className="animate-float pointer-events-none absolute -left-32 top-10 -z-10 size-[36rem] rounded-full bg-gold/10 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 hairline" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow flex items-center gap-3 text-gold-soft">
              <Icon name="lock" className="size-4" /> Members only
            </p>
            <h2 id="po-title" className="font-display mt-4 text-5xl leading-[1.02] sm:text-7xl">
              The Private Office.
              <br />
              <em className="gold-text italic">Where the unlisted live.</em>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ivory/65">
              A confidential portfolio for verified principals and their advisors — complete 3D models, exact locations and discreet introductions, behind a secure session.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f.t} className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                    <Icon name={f.icon} className="size-[1.15rem]" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{f.t}</span>
                    <span className="block text-xs leading-relaxed text-ivory/55">{f.d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {unlocked ? (
                <>
                  <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm">
                    <span className="size-2 rounded-full bg-emerald-400" /> Signed in as <strong className="font-medium">{email}</strong>
                  </span>
                  <button type="button" onClick={() => void lock()} className="btn btn-ghost-dark btn-sm">
                    Lock the office
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => openAccess("enter")} className="btn btn-gold">
                    <Icon name="key" className="size-4" /> Enter with access code
                  </button>
                  <button type="button" onClick={() => openAccess("request")} className="btn btn-ghost-dark">
                    Request access
                  </button>
                </>
              )}
            </div>
          </Reveal>

          <div className="lg:col-span-7">
            {unlocked ? (
              <ul className="grid gap-5 sm:grid-cols-2" aria-label="Off-market residences">
                {priv.map((p, i) => (
                  <Reveal as="li" key={p.id} delay={i * 100} className={i === 0 ? "sm:col-span-2" : ""}>
                    <button type="button" onClick={() => openStudio(p.id, "explore")} className="group relative block w-full overflow-hidden rounded-[1.75rem] text-left">
                      <div className={`relative overflow-hidden ${i === 0 ? "aspect-[16/8]" : "aspect-[4/3]"}`}>
                        <Image src={p.image} alt={`${p.name}, ${p.city}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition-transform duration-[1400ms] group-hover:scale-105" />
                        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                        <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-ink">Off-market</span>
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <p className="text-xs text-ivory/70">
                            {p.city}, {p.country} · {p.type}
                          </p>
                          <h3 className="font-display mt-1 text-3xl leading-none">{p.name}</h3>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="font-display text-2xl text-gold-soft">{formatPrice(p.price)}</span>
                            <span className="text-xs text-ivory/60">
                              {p.beds} bd · {formatNumber(p.sqft)} sq ft
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </Reveal>
                ))}
              </ul>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2" aria-label="Off-market opportunities (locked)">
                {teasers.map((t, i) => (
                  <Reveal as="li" key={t.id} delay={i * 100} className={i === 0 ? "sm:col-span-2" : ""}>
                    <button type="button" onClick={() => openAccess("enter")} className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/10 p-6 text-left transition hover:border-gold/50 ${i === 0 ? "aspect-[16/8]" : "aspect-[4/3]"}`}>
                      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,167,102,0.22),transparent_55%),linear-gradient(135deg,#17171c,#0c0c0f)]" />
                      <div aria-hidden className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(circle_at_70%_30%,#000,transparent_70%)]" />
                      <div aria-hidden className="animate-shimmer absolute inset-0 bg-[linear-gradient(110deg,transparent_35%,rgba(232,213,168,0.12)_50%,transparent_65%)] [background-size:200%_100%]" />
                      <div className="relative flex items-start justify-between">
                        <span className="glass rounded-full px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em]">Confidential</span>
                        <span className="grid size-11 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold transition group-hover:scale-110 group-hover:bg-gold group-hover:text-ink">
                          <Icon name="lock" className="size-5" />
                        </span>
                      </div>
                      <div className="relative">
                        <p className="text-xs text-ivory/55">
                          {t.region} · {t.type}
                        </p>
                        <p className="font-display mt-1.5 text-3xl leading-none">
                          <span className="select-none blur-[7px]" aria-hidden>
                            Undisclosed estate
                          </span>
                          <span className="sr-only">Undisclosed estate</span>
                        </p>
                        <p className="mt-3 flex items-center justify-between text-sm">
                          <span className="font-display text-2xl text-gold-soft">{t.priceBand}</span>
                          <span className="text-xs text-ivory/55">{t.beds} bedrooms · Unlock to view</span>
                        </p>
                      </div>
                    </button>
                  </Reveal>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
