"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { Reveal } from "./Reveal";
import { Icon, type IconName } from "./Icons";
import { useAtrium } from "./AtriumProvider";

function Spot({ children, className = "", dark = false }: { children: ReactNode; className?: string; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={move}
      className={`group relative overflow-hidden rounded-[2rem] border p-7 transition-all duration-500 hover:-translate-y-1 sm:p-9 ${
        dark ? "border-white/10 bg-ink text-ivory" : "border-ink/10 bg-white/60 hover:border-gold/50 hover:shadow-[0_30px_70px_-30px_rgba(120,90,30,0.35)]"
      } ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), ${dark ? "rgba(201,167,102,0.16)" : "rgba(201,167,102,0.18)"}, transparent 60%)` }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function Tag({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-current/15 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.16em] opacity-80">
      <Icon name={icon} className="size-3.5 text-gold" />
      {children}
    </span>
  );
}

function IsoHouse() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8d5a8" />
          <stop offset="1" stopColor="#c9a766" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#g1)" strokeWidth="1.2" className="origin-center transition-transform duration-700 group-hover:-translate-y-1">
        <path d="M60 130l100 50 100-50V80L160 30 60 80z" opacity=".35" />
        <path d="M60 130l100-50 100 50M160 80v100M60 80l100 50 100-50" />
        <path d="M90 100l70-35 70 35" opacity=".6" />
        <path d="M110 112v38l50 25M210 112v38l-50 25" opacity=".5" />
        <rect x="140" y="132" width="40" height="40" transform="skewY(-26) translate(0 60)" opacity=".4" />
      </g>
      <circle cx="160" cy="30" r="3" fill="#e8d5a8" className="animate-pulse-ring origin-center [transform-box:fill-box]" />
    </svg>
  );
}

function Stack() {
  return (
    <svg viewBox="0 0 200 180" className="mx-auto h-full w-full max-w-[14rem]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <g key={i} className="transition-transform duration-700 ease-out" style={{ transform: `translateY(${i * 42}px)` }}>
          <g className={`transition-transform duration-700 ${i === 0 ? "group-hover:-translate-y-6" : i === 2 ? "group-hover:translate-y-6" : ""}`}>
            <path d="M100 24l70 28-70 28-70-28z" fill={i === 0 ? "#c9a766" : "#e8d5a8"} opacity={0.35 + i * 0.2} stroke="#8a6f3c" strokeWidth="1" />
            <path d="M30 52v10l70 28 70-28V52" fill="none" stroke="#8a6f3c" strokeWidth="1" opacity=".6" />
          </g>
        </g>
      ))}
    </svg>
  );
}

function PlanSnippet() {
  return (
    <svg viewBox="0 0 220 150" className="h-full w-full" aria-hidden>
      <rect x="10" y="10" width="200" height="130" fill="#f7f4ee" stroke="#1b1b1f" strokeWidth="3" />
      <path d="M90 10v70M10 80h80M90 80h120M150 80v60M90 45h30" stroke="#1b1b1f" strokeWidth="1.6" fill="none" />
      <path d="M90 50a14 14 0 0114-14" stroke="#c9a766" fill="none" />
      <rect x="152" y="96" width="46" height="26" fill="#9bd0dd" opacity=".7" />
      <text x="36" y="48" fontSize="7" fill="#6f6b64">Great Room</text>
      <text x="108" y="30" fontSize="7" fill="#6f6b64">Study</text>
      <text x="30" y="112" fontSize="7" fill="#6f6b64">Kitchen</text>
      <path d="M10 150h50" stroke="#c9a766" strokeWidth="2" />
    </svg>
  );
}

function Radar() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[12rem]" aria-hidden>
      {[1, 0.72, 0.44].map((s) => (
        <span key={s} className="absolute inset-0 m-auto rounded-full border border-gold/40" style={{ width: `${s * 100}%`, height: `${s * 100}%` }} />
      ))}
      <span className="absolute inset-0 m-auto h-px w-full bg-gold/25" />
      <span className="absolute inset-0 m-auto h-full w-px bg-gold/25" />
      <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold" />
      <span className="animate-pulse-ring absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold" />
      {[
        [24, 30],
        [70, 24],
        [76, 66],
        [30, 74],
      ].map(([x, y], i) => (
        <span key={i} className="absolute size-1.5 rounded-full bg-ink/50" style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
    </div>
  );
}

export function Features() {
  const { openStudio, properties, openAccess } = useAtrium();
  const first = properties[0];
  return (
    <section id="experience" aria-labelledby="features-title" className="relative bg-bone/60 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-gold-deep">The Atrium experience</p>
          <h2 id="features-title" className="font-display mt-4 text-5xl leading-[1.02] sm:text-7xl">
            An entirely new way to <em className="italic">know</em> a home.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute">
            Photographs flatter. Atrium informs. Every residence is a navigable digital twin — complete with plans, dimensions, location intelligence and the freedom to explore on your own terms.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <Reveal className="md:col-span-2">
            <Spot dark className="h-full min-h-[22rem]">
              <div className="grid h-full gap-6 sm:grid-cols-2 sm:items-center">
                <div>
                  <Tag icon="cube">Immersive 3D</Tag>
                  <h3 className="font-display mt-5 text-4xl leading-tight sm:text-5xl">Walk every room. Open every door.</h3>
                  <p className="mt-4 max-w-md text-ivory/65">Orbit the exterior, glide through the entrance and walk the corridors in first person. Glass opens as you approach; every signature object can be inspected up close.</p>
                  <button type="button" onClick={() => openStudio(first.id, "explore")} className="btn btn-gold btn-sm mt-7">
                    Try the walkthrough <Icon name="arrow-right" className="size-4" />
                  </button>
                </div>
                <div className="relative h-52 sm:h-full sm:min-h-[16rem]">
                  <IsoHouse />
                </div>
              </div>
            </Spot>
          </Reveal>
          <Reveal delay={100}>
            <Spot className="h-full">
              <Tag icon="exploded">Architecture, revealed</Tag>
              <div className="my-4 h-44">
                <Stack />
              </div>
              <h3 className="font-display text-3xl leading-tight">Separate, hide, lift, see through.</h3>
              <p className="mt-3 text-sm text-mute">Explode the floors apart, lift the roof, switch on X-ray or isolate a single level to grasp how the house truly works.</p>
            </Spot>
          </Reveal>

          <Reveal>
            <Spot className="h-full">
              <Tag icon="plan">Floor plans</Tag>
              <div className="my-4 h-40">
                <PlanSnippet />
              </div>
              <h3 className="font-display text-3xl leading-tight">True-to-scale plans, to the centimetre.</h3>
              <p className="mt-3 text-sm text-mute">Every room dimensioned in metres or feet, with door swings, glazing and a full area schedule — linked to the 3D model.</p>
            </Spot>
          </Reveal>
          <Reveal delay={100}>
            <Spot className="h-full">
              <Tag icon="pin">Location intelligence</Tag>
              <div className="my-4">
                <Radar />
              </div>
              <h3 className="font-display text-3xl leading-tight">Roads, neighbours, airfields.</h3>
              <p className="mt-3 text-sm text-mute">A live interactive map reveals the exact position, surrounding streets and neighbouring structures, in satellite or street view.</p>
            </Spot>
          </Reveal>
          <Reveal delay={200}>
            <Spot className="h-full">
              <Tag icon="search">Instant filtering</Tag>
              <div className="my-4 flex flex-wrap gap-2" aria-hidden>
                {["Europe", "Villa", "$20–40M", "6+ beds", "Waterfront"].map((c, i) => (
                  <span key={c} className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-500 ${i % 2 ? "border-ink/15" : "border-gold bg-gold/15 text-gold-deep"} group-hover:-translate-y-0.5`} style={{ transitionDelay: `${i * 50}ms` }}>
                    {c}
                  </span>
                ))}
              </div>
              <h3 className="font-display text-3xl leading-tight">From the world to the shortlist in a heartbeat.</h3>
              <p className="mt-3 text-sm text-mute">Region, price, type, bedrooms — results respond as you type, with a map view and a private shortlist.</p>
            </Spot>
          </Reveal>

          <Reveal className="md:col-span-3">
            <Spot className="bg-gradient-to-br from-white/70 to-gold-soft/30">
              <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
                <div>
                  <Tag icon="lock">The Private Office</Tag>
                  <h3 className="font-display mt-5 max-w-2xl text-4xl leading-tight sm:text-5xl">Some of the finest properties are never advertised.</h3>
                  <p className="mt-4 max-w-2xl text-mute">Verified principals unlock a confidential portfolio of off-market estates — precise locations, full 3D models and discreet introductions, all behind a secure session.</p>
                </div>
                <button type="button" onClick={() => openAccess("enter")} className="btn btn-dark">
                  <Icon name="key" className="size-4 text-gold" /> Enter the Private Office
                </button>
              </div>
            </Spot>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
