"use client";

import { useState } from "react";
import { Icon, type IconName } from "./Icons";
import { Reveal } from "./Reveal";

const AUD: { id: string; label: string; icon: IconName; title: string; copy: string; points: string[]; stat: [string, string] }[] = [
  {
    id: "uhnw",
    label: "Private buyers",
    icon: "key",
    title: "Privacy first. Convenience always.",
    copy: "You value discretion, accuracy and your own time. Atrium lets you inspect a home in extraordinary depth from your own library — with nobody watching.",
    points: ["Tour any residence without a single enquiry", "Verified information from owners and counsel", "Discreet introductions through a personal advisor", "Shortlists that sync across your devices"],
    stat: ["0", "enquiries required to explore any public listing"],
  },
  {
    id: "office",
    label: "Family offices & investors",
    icon: "trend",
    title: "Diligence without the departure lounge.",
    copy: "Compare assets across continents with the same rigour. Measured plans, location intelligence and investment indicators sit beside every model.",
    points: ["Area schedules in m² and sq ft, room by room", "Neighbouring structures, roads and access mapped live", "Appreciation, holding-cost and liquidity indicators", "Private Office access to unlisted opportunities"],
    stat: ["62%", "fewer site visits to reach a confident shortlist"],
  },
  {
    id: "brokers",
    label: "Brokers & developers",
    icon: "building",
    title: "A showroom worthy of the property.",
    copy: "Present a $50M estate the way it deserves: as an experience. Qualified buyers arrive informed, serious and ready to discuss terms.",
    points: ["Verified digital twin within ten days", "Branded showroom and private-link sharing", "Lead qualification with proof of funds workflow", "Analytics on which rooms hold attention"],
    stat: ["3×", "more qualified viewings per listing"],
  },
  {
    id: "global",
    label: "International buyers",
    icon: "globe",
    title: "Be there without being there.",
    copy: "Entrepreneurs, executives and globally mobile families evaluate homes across time zones — and arrive only for the ones that matter.",
    points: ["Dusk-to-night lighting studies in every model", "Flight, helipad and marina distances at a glance", "Multi-currency, multi-jurisdiction support", "Advisors in 14 cities, on call across time zones"],
    stat: ["38", "countries represented in the collection"],
  },
  {
    id: "design",
    label: "Architecture enthusiasts",
    icon: "sparkle",
    title: "Study the buildings you admire.",
    copy: "Explode a cantilevered villa into its floors, lift a roof, X-ray the walls. Atrium is a quiet museum of residential architecture — open to all.",
    points: ["Explore public residences freely, no account needed", "Discover architects, ateliers and their signature works", "Understand structure with exploded and X-ray views", "Share a favourite with a single link"],
    stat: ["11", "architects and ateliers currently featured"],
  },
];

export function Audiences() {
  const [i, setI] = useState(0);
  const a = AUD[i];
  return (
    <section id="benefits" aria-labelledby="benefits-title" className="relative bg-ivory py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-gold-deep">Built for the few</p>
          <h2 id="benefits-title" className="font-display mt-4 text-5xl leading-[1.02] sm:text-7xl">
            A deliberately narrow audience, served <em className="italic">deeply</em>.
          </h2>
        </Reveal>

        <Reveal delay={100} className="mt-12 grid gap-6 lg:grid-cols-[18rem_1fr]">
          <div role="tablist" aria-label="Who Atrium serves" aria-orientation="vertical" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {AUD.map((x, k) => (
              <button
                key={x.id}
                role="tab"
                id={`aud-${x.id}`}
                aria-selected={i === k}
                aria-controls={`aud-panel-${x.id}`}
                onClick={() => setI(k)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" || e.key === "ArrowRight") setI((k + 1) % AUD.length);
                  if (e.key === "ArrowUp" || e.key === "ArrowLeft") setI((k - 1 + AUD.length) % AUD.length);
                }}
                className={`group flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition-all duration-300 ${
                  i === k ? "border-ink bg-ink text-ivory shadow-xl" : "border-ink/10 bg-white/60 hover:border-ink/30"
                }`}
              >
                <span className={`grid size-9 place-items-center rounded-full transition ${i === k ? "bg-gold text-ink" : "bg-ink/5 text-gold-deep"}`}>
                  <Icon name={x.icon} className="size-4" />
                </span>
                <span className="font-medium">{x.label}</span>
              </button>
            ))}
          </div>

          <div key={a.id} role="tabpanel" id={`aud-panel-${a.id}`} aria-labelledby={`aud-${a.id}`} className="animate-card-in grid gap-8 rounded-[2rem] border border-ink/10 bg-white p-7 shadow-[0_30px_80px_-50px_rgba(60,40,10,0.45)] sm:p-10 xl:grid-cols-[1fr_16rem]">
            <div>
              <h3 className="font-display text-4xl leading-tight sm:text-5xl">{a.title}</h3>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-mute">{a.copy}</p>
              <ul className="mt-7 grid gap-3.5 sm:grid-cols-2">
                {a.points.map((p, k) => (
                  <li key={p} className="animate-card-in flex gap-3 text-sm leading-snug" style={{ animationDelay: `${120 + k * 70}ms` }}>
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold/25 text-gold-deep">
                      <Icon name="check" className="size-3" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative flex flex-col justify-end overflow-hidden rounded-3xl bg-ink p-6 text-ivory">
              <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-gold/30 blur-3xl" />
              <p className="font-display relative text-7xl text-gold-soft">{a.stat[0]}</p>
              <p className="relative mt-2 text-sm text-ivory/65">{a.stat[1]}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
