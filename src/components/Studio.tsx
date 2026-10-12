"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { computeLayout, SQM_TO_SQFT } from "@/lib/layout";
import { formatNumber, formatPrice, formatUSD } from "@/lib/format";
import type { Property } from "@/lib/types";
import { useAtrium, type StudioTab } from "./AtriumProvider";
import { FloorPlan } from "./FloorPlan";
import { Icon, type IconName } from "./Icons";
import { Reveal } from "./Reveal";
import type { Intel } from "./AtriumMap";
import type { ViewerApi } from "./Viewer3D";

const Viewer3D = dynamic(() => import("./Viewer3D"), {
  ssr: false,
  loading: () => <div className="grid h-[64vh] min-h-[440px] place-items-center rounded-[1.75rem] bg-ink-2 text-sm text-ivory/50 lg:h-[700px]">Preparing the 3D engine…</div>,
});
const AtriumMap = dynamic(() => import("./AtriumMap"), { ssr: false, loading: () => <div className="h-full w-full bg-ink-2" /> });

const TABS: { id: StudioTab; label: string; icon: IconName }[] = [
  { id: "explore", label: "3D Explorer", icon: "cube" },
  { id: "plans", label: "Floor plans", icon: "plan" },
  { id: "map", label: "Map & surroundings", icon: "pin" },
  { id: "details", label: "Specifications", icon: "building" },
];

function MapPanel({ p }: { p: Property }) {
  const [intel, setIntel] = useState<Intel>({ status: "idle", buildings: 0, roads: [] });
  const list = useMemo(() => [p], [p]);
  const fmt = (n: number, pos: string, neg: string) => `${Math.abs(n).toFixed(4)}° ${n >= 0 ? pos : neg}`;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <AtriumMap properties={list} activeId={p.id} detail onIntel={setIntel} className="h-[62vh] min-h-[420px] rounded-[1.75rem] border border-ink/10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.5)] lg:h-[640px]" />
      <aside className="flex flex-col gap-4" aria-label="Location intelligence">
        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-5">
          <p className="eyebrow text-gold-deep">Exact location</p>
          <h3 className="font-display mt-1 text-3xl">{p.city}</h3>
          <p className="text-sm text-mute">
            {p.region}, {p.country}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-mute">Latitude</dt>
              <dd className="font-medium tabular-nums">{fmt(p.lat, "N", "S")}</dd>
            </div>
            <div>
              <dt className="text-xs text-mute">Longitude</dt>
              <dd className="font-medium tabular-nums">{fmt(p.lng, "E", "W")}</dd>
            </div>
          </dl>
          <a href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light btn-sm mt-4 w-full">
            Open in external maps <Icon name="arrow-up-right" className="size-4" />
          </a>
        </div>

        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-5">
          <h3 className="text-sm font-medium">Surroundings (live)</h3>
          {intel.status === "loading" && <p className="mt-3 text-sm text-mute">Scanning streets and neighbouring structures…</p>}
          {intel.status === "error" && <p className="mt-3 text-sm text-mute">Live neighbourhood data is temporarily unavailable. The map remains fully interactive.</p>}
          {intel.status === "ready" && (
            <>
              <p className="mt-3 text-sm text-mute">
                <strong className="font-display text-3xl text-ink">{intel.buildings}</strong> neighbouring structures within 330 m.
              </p>
              {intel.roads.length > 0 && (
                <>
                  <p className="mt-4 text-xs text-mute">Surrounding roads</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {intel.roads.map((r) => (
                      <li key={r} className="rounded-full bg-ink/5 px-3 py-1 text-xs">
                        {r}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
          {intel.status === "idle" && <p className="mt-3 text-sm text-mute">Loading map…</p>}
        </div>

        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-5">
          <h3 className="text-sm font-medium">Getting there</h3>
          <ul className="mt-3 divide-y divide-ink/5">
            {p.facts.nearby.map((n) => (
              <li key={n.label} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span>{n.label}</span>
                <span className="shrink-0 text-xs text-mute">{n.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Details({ p, onEnquire }: { p: Property; onEnquire: (kind: string) => void }) {
  const layout = useMemo(() => computeLayout(p.model), [p.model]);
  const sqm = layout.totalArea;
  const rows: [string, string][] = [
    ["Asking price", formatUSD(p.price)],
    ["Price per sq ft", formatUSD(p.price / p.sqft)],
    ["Internal area", `${formatNumber(sqm)} m² · ${formatNumber(sqm * SQM_TO_SQFT)} sq ft`],
    ["Terraces & outdoor", `${formatNumber(layout.terraceArea)} m²`],
    ["Plot", p.lotAcres ? `${p.lotAcres} acres` : "Apartment · shared title"],
    ["Bedrooms / Bathrooms", `${p.beds} / ${p.baths}`],
    ["Levels", `${layout.floors.length}`],
    ["Year", `${p.yearBuilt}`],
    ["Architect", p.architect],
    ["Typology", p.type],
  ];
  const f = p.facts;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-[1.75rem] border border-ink/10 bg-white p-7 lg:col-span-2">
        <p className="eyebrow text-gold-deep">The residence</p>
        <h3 className="font-display mt-2 text-4xl leading-tight sm:text-5xl">{p.tagline}</h3>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mute">{p.description}</p>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {p.highlights.map((h) => (
            <li key={h} className="flex gap-3 text-sm">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold/25 text-gold-deep">
                <Icon name="check" className="size-3" />
              </span>
              {h}
            </li>
          ))}
        </ul>
        <h4 className="mt-8 text-sm font-medium">Amenities</h4>
        <ul className="mt-3 flex flex-wrap gap-2">
          {p.amenities.map((a) => (
            <li key={a} className="rounded-full border border-ink/12 bg-ivory px-3.5 py-1.5 text-xs">
              {a}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => onEnquire("viewing")} className="btn btn-dark">
            Request private viewing
          </button>
          <button onClick={() => onEnquire("information")} className="btn btn-ghost-light">
            Request full dossier
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <dl className="rounded-[1.75rem] border border-ink/10 bg-white p-6">
          <h4 className="mb-2 text-sm font-medium">Key facts</h4>
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4 border-t border-ink/5 py-2.5 text-sm first:border-0">
              <dt className="text-mute">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-[1.75rem] bg-ink p-6 text-ivory">
          <h4 className="eyebrow !text-[0.66rem] text-gold-soft">Investment lens</h4>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display text-3xl text-gold-soft">+{f.appreciation5y}%</p>
              <p className="mt-1 text-[0.68rem] leading-tight text-ivory/55">5-yr local appreciation</p>
            </div>
            <div>
              <p className="font-display text-3xl text-gold-soft">{f.holdingCostPct}%</p>
              <p className="mt-1 text-[0.68rem] leading-tight text-ivory/55">est. annual holding cost</p>
            </div>
            <div>
              <p className="font-display text-xl leading-[1.9rem] text-gold-soft">{f.liquidity}</p>
              <p className="mt-1 text-[0.68rem] leading-tight text-ivory/55">market liquidity</p>
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-soft" style={{ width: `${Math.min(100, f.appreciation5y * 1.8)}%` }} />
          </div>
          <p className="mt-3 text-[0.68rem] leading-relaxed text-ivory/40">Indicative figures from Atrium market intelligence. Not financial advice.</p>
        </div>
        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-6">
          <h4 className="mb-3 text-sm font-medium">Verified by Atrium</h4>
          <ul className="grid gap-2.5 text-sm">
            {["Title & ownership confirmed", "Laser-measured, to-scale model", "Planning & zoning reviewed", "Environmental & flood assessment"].map((v) => (
              <li key={v} className="flex items-center gap-3">
                <Icon name="shield" className="size-4 text-gold-deep" />
                {v}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function Studio() {
  const { properties, active, setActive, tab, setTab, openEnquiry, saved, toggleSaved } = useAtrium();
  const apiRef = useRef<ViewerApi | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [visited, setVisited] = useState<Set<StudioTab>>(() => new Set<StudioTab>(["explore"]));

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "700px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setVisited((v) => (v.has(tab) ? v : new Set(v).add(tab)));
  }, [tab]);

  const viewRoom = (id: string) => {
    setTab("explore");
    window.setTimeout(() => apiRef.current?.flyToRoom(id), 450);
    document.getElementById("studio-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isSaved = saved.includes(active.id);

  return (
    <section ref={sectionRef} id="studio" aria-labelledby="studio-title" className="grain relative isolate overflow-hidden bg-ink py-24 text-ivory sm:py-32">
      <div aria-hidden className="animate-float-slow pointer-events-none absolute -right-40 top-20 -z-10 size-[40rem] rounded-full bg-gold/10 blur-[140px]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-gold-soft">The 3D studio</p>
          <h2 id="studio-title" className="font-display mt-4 text-5xl leading-[1.02] sm:text-7xl">
            Step inside before <em className="gold-text italic">anyone</em> else does.
          </h2>
          <p className="mt-5 text-lg text-ivory/65">Choose a residence. Orbit it, open it, walk it. Then study the plans and the neighbourhood, all in one place.</p>
        </Reveal>

        {/* property selector */}
        <Reveal delay={100}>
          <ul className="no-scrollbar -mx-5 mt-10 flex gap-3 overflow-x-auto px-5 pb-3 sm:mx-0 sm:px-0" aria-label="Choose a residence">
            {properties.map((p) => {
              const on = p.id === active.id;
              return (
                <li key={p.id} className="shrink-0">
                  <button type="button" onClick={() => setActive(p.id)} aria-pressed={on} className={`group flex w-56 items-center gap-3 rounded-2xl border p-2 pr-4 text-left transition duration-300 ${on ? "border-gold bg-gold/10" : "border-white/10 bg-white/[0.03] hover:border-white/30"}`}>
                    <Image src={p.image} alt="" width={64} height={64} sizes="56px" className="size-14 rounded-xl object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {p.offMarket && <Icon name="lock" className="size-3 shrink-0 text-gold" />}
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="block truncate text-xs text-ivory/50">
                        {p.city} · {formatPrice(p.price)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Reveal>

        {/* header */}
        <div id="studio-panel" className="mt-8 scroll-mt-24">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div key={active.id} className="animate-fade-up">
              <p className="flex items-center gap-2 text-sm text-ivory/60">
                <Icon name="pin" className="size-4 text-gold" /> {active.city}, {active.region}, {active.country}
                {active.offMarket && <span className="ml-2 rounded-full bg-gold px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-ink">Off-market</span>}
              </p>
              <h3 className="font-display mt-2 text-5xl leading-none sm:text-6xl">{active.name}</h3>
              <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ivory/65">
                <span className="font-display text-3xl text-gold-soft">{formatPrice(active.price)}</span>
                <span>{active.beds} beds</span>
                <span>{active.baths} baths</span>
                <span>{formatNumber(active.sqft)} sq ft</span>
                <span>{active.architect}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={() => toggleSaved(active.id)} aria-pressed={isSaved} className="btn btn-ghost-dark btn-sm">
                <Icon name="heart" className={`size-4 ${isSaved ? "fill-gold text-gold" : ""}`} /> {isSaved ? "Shortlisted" : "Shortlist"}
              </button>
              <button type="button" onClick={() => openEnquiry(active.id, "consultation")} className="btn btn-ghost-dark btn-sm">
                Speak with an advisor
              </button>
              <button type="button" onClick={() => openEnquiry(active.id, "viewing")} className="btn btn-gold btn-sm">
                Request private viewing
              </button>
            </div>
          </div>

          {/* tabs */}
          <div role="tablist" aria-label="Residence views" className="no-scrollbar mt-7 flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1 sm:w-fit">
            {TABS.map((t) => (
              <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm transition ${tab === t.id ? "bg-gold font-medium text-ink" : "text-ivory/70 hover:text-ivory"}`}>
                <Icon name={t.icon} className="size-4" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div role="tabpanel" id="panel-explore" aria-labelledby="tab-explore" className={tab === "explore" ? "" : "hidden"}>
              {near && <Viewer3D property={active} onEnquire={() => openEnquiry(active.id, "viewing")} registerApi={(a) => (apiRef.current = a)} />}
            </div>
            {visited.has("plans") && (
              <div role="tabpanel" id="panel-plans" aria-labelledby="tab-plans" className={`rounded-[2rem] bg-ivory p-4 text-ink sm:p-6 ${tab === "plans" ? "" : "hidden"}`}>
                <FloorPlan key={active.id} property={active} onViewRoom={viewRoom} />
              </div>
            )}
            {visited.has("map") && (
              <div role="tabpanel" id="panel-map" aria-labelledby="tab-map" className={`rounded-[2rem] bg-ivory p-4 text-ink sm:p-6 ${tab === "map" ? "" : "hidden"}`}>
                <MapPanel p={active} />
              </div>
            )}
            {visited.has("details") && (
              <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" className={`rounded-[2rem] bg-ivory p-4 text-ink sm:p-6 ${tab === "details" ? "" : "hidden"}`}>
                <Details p={active} onEnquire={(k) => openEnquiry(active.id, k)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
