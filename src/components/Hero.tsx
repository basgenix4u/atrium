"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { useAtrium } from "./AtriumProvider";
import { Icon } from "./Icons";
import { CountUp } from "./Reveal";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

const STATS = [
  { to: 2.4, prefix: "$", suffix: "B", decimals: 1, label: "in curated listings" },
  { to: 38, suffix: "", decimals: 0, label: "countries represented" },
  { to: 100, suffix: "%", decimals: 0, label: "enterable in 3D" },
];

export function Hero() {
  const { properties, openStudio, openAccess } = useAtrium();
  const feat = properties[0];

  return (
    <section id="top" aria-labelledby="hero-title" className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink text-ivory">
      {/* poster image — visible until WebGL is ready, and as a graceful fallback */}
      <Image src={feat.image} alt="" aria-hidden="true" priority fill sizes="100vw" className="absolute inset-0 z-0 size-full object-cover opacity-45" />
      <HeroScene model={feat.model} />
      <div aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-r from-ink via-ink/55 to-transparent lg:via-ink/35" />
      <div aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-ink via-transparent to-ink/60" />
      <div aria-hidden className="animate-float-slow absolute -left-40 top-1/3 z-[2] size-[34rem] rounded-full bg-gold/10 blur-[120px]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow animate-fade-up flex items-center gap-3 text-gold-soft" style={{ animationDelay: "100ms" }}>
            <span className="h-px w-10 bg-gold" /> A private digital gallery · $10M+ residences
          </p>
          <h1 id="hero-title" className="font-display animate-fade-up mt-6 text-[clamp(2.9rem,6.3vw,6.1rem)] font-light leading-[0.94]" style={{ animationDelay: "250ms" }}>
            The world&apos;s finest homes,{" "}
            <em className="gold-text animate-shimmer pr-2 font-normal italic" style={{ animationDuration: "6s" }}>
              entered
            </em>
            <br className="hidden sm:block" /> not just viewed.
          </h1>
          <p className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-ivory/72" style={{ animationDelay: "450ms" }}>
            Walk through every floor. Orbit the architecture. Open the doors, lift the roof, study the plans and the neighbourhood — then speak with an advisor.
            Atrium lets you evaluate a masterpiece in minutes, from anywhere on earth.
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "600ms" }}>
            <button type="button" onClick={() => openStudio(feat.id, "explore")} className="btn btn-gold">
              <Icon name="cube" className="size-4" />
              Step inside {feat.name}
            </button>
            <a href="#collection" className="btn btn-ghost-dark">
              Browse the collection
              <Icon name="arrow-right" className="size-4" />
            </a>
            <button type="button" onClick={() => openAccess("enter")} className="ml-1 inline-flex items-center gap-2 px-2 py-3 text-sm text-ivory/70 underline-offset-4 transition hover:text-gold-soft hover:underline">
              <Icon name="lock" className="size-4" /> Private Office
            </button>
          </div>

          <dl className="animate-fade-up mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6 [@media(max-height:880px)]:hidden" style={{ animationDelay: "800ms" }}>
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-4xl text-ivory sm:text-5xl">
                  <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                </dd>
                <p className="mt-1 text-xs leading-snug text-ivory/55" aria-hidden>
                  {s.label}
                </p>
              </div>
            ))}
          </dl>
        </div>

        <aside className="animate-fade-up lg:col-span-5 lg:justify-self-end" style={{ animationDelay: "900ms" }} aria-label="Featured residence">
          <div className="glass group w-full max-w-md rounded-[1.75rem] p-5 transition-transform duration-500 hover:-translate-y-1">
            <div className="flex items-center justify-between text-xs text-ivory/60">
              <span className="eyebrow !text-[0.65rem] text-gold-soft">Now touring</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-emerald-400" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                Live 3D · Dusk
              </span>
            </div>
            <h2 className="font-display mt-3 text-3xl leading-none">{feat.name}</h2>
            <p className="mt-1.5 text-sm text-ivory/60">
              {feat.city}, {feat.region} · {feat.architect}
            </p>
            <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-xs text-ivory/50">Offered at</p>
                <p className="font-display text-3xl text-gold-soft">{formatPrice(feat.price)}</p>
              </div>
              <button type="button" onClick={() => openStudio(feat.id, "explore")} className="btn btn-ghost-dark btn-sm">
                Explore <Icon name="arrow-up-right" className="size-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      <a href="#social-proof" aria-label="Scroll to content" className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-ivory/50 sm:flex">
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-white/15">
          <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-gold" />
        </span>
      </a>
    </section>
  );
}
