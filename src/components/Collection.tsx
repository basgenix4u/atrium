"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";
import { formatNumber, formatPrice } from "@/lib/format";
import type { Property } from "@/lib/types";
import { useAtrium } from "./AtriumProvider";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

const AtriumMap = dynamic(() => import("./AtriumMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-ink-2" />,
});

type Sort = "featured" | "price-asc" | "price-desc" | "size";

function Card({ p, i, saved, onSave, onOpen }: { p: Property; i: number; saved: boolean; onSave: () => void; onOpen: () => void }) {
  return (
    <article className="group animate-card-in relative isolate overflow-hidden rounded-[1.75rem] bg-ink text-ivory shadow-[0_24px_60px_-34px_rgba(0,0,0,0.6)]" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image src={p.image} alt={`${p.name}, ${p.city} — ${p.type}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.08]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-ink/30" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
          <span className="glass rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] !bg-ink/50">{p.type}</span>
          {p.offMarket && <span className="rounded-full bg-gold px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink">Off-market</span>}
        </div>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${p.name} from shortlist` : `Save ${p.name} to shortlist`}
          className={`absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full border backdrop-blur-md transition duration-300 hover:scale-110 ${saved ? "border-gold bg-gold text-ink" : "border-white/25 bg-ink/40 text-ivory"}`}
        >
          <Icon name="heart" className={`size-[1.15rem] ${saved ? "fill-current" : ""}`} />
        </button>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="flex items-center gap-1.5 text-xs text-ivory/70">
            <Icon name="pin" className="size-3.5 text-gold" />
            {p.city}, {p.country}
          </p>
          <h3 className="font-display mt-1.5 text-[2rem] leading-none">
            <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-offset-[-6px]">
              {p.name}
            </button>
          </h3>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="font-display text-3xl text-gold-soft">{formatPrice(p.price)}</p>
            <p className="text-right text-[0.7rem] leading-snug text-ivory/60">
              {p.beds} bd · {p.baths} ba
              <br />
              {formatNumber(p.sqft)} sq ft
            </p>
          </div>
          <div className="grid grid-rows-[0fr] transition-all duration-500 group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <span className="mt-4 flex items-center justify-between rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-medium backdrop-blur">
                <span className="flex items-center gap-2">
                  <Icon name="cube" className="size-4 text-gold" /> Enter in 3D · plans · map
                </span>
                <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Collection() {
  const { properties, teasers, unlocked, openStudio, openAccess, saved, toggleSaved } = useAtrium();

  const maxAll = useMemo(() => Math.ceil(Math.max(...properties.map((p) => p.price)) / 5_000_000) * 5_000_000, [properties]);
  const minAll = 10_000_000;
  const regions = useMemo(() => ["All regions", ...Array.from(new Set(properties.map((p) => p.continent)))], [properties]);
  const types = useMemo(() => ["All types", ...Array.from(new Set(properties.map((p) => p.type)))], [properties]);

  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All regions");
  const [type, setType] = useState("All types");
  const [budget, setBudget] = useState(maxAll);
  const [beds, setBeds] = useState(0);
  const [sort, setSort] = useState<Sort>("featured");
  const [view, setView] = useState<"grid" | "map">("grid");
  const [savedOnly, setSavedOnly] = useState(false);
  const [mapSel, setMapSel] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = properties.filter((p) => {
      if (region !== "All regions" && p.continent !== region) return false;
      if (type !== "All types" && p.type !== type) return false;
      if (p.price > budget) return false;
      if (p.beds < beds) return false;
      if (savedOnly && !saved.includes(p.id)) return false;
      if (needle && !`${p.name} ${p.city} ${p.region} ${p.country} ${p.type} ${p.architect}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "size") list = [...list].sort((a, b) => b.sqft - a.sqft);
    return list;
  }, [properties, q, region, type, budget, beds, sort, savedOnly, saved]);

  const dirty = q || region !== "All regions" || type !== "All types" || budget !== maxAll || beds > 0 || savedOnly || sort !== "featured";
  const reset = () => {
    setQ("");
    setRegion("All regions");
    setType("All types");
    setBudget(maxAll);
    setBeds(0);
    setSort("featured");
    setSavedOnly(false);
  };
  const selected = filtered.find((p) => p.id === mapSel) ?? null;
  const pct = ((budget - minAll) / (maxAll - minAll)) * 100;

  return (
    <section id="collection" aria-labelledby="collection-title" className="relative bg-ivory py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow text-gold-deep">The collection</p>
            <h2 id="collection-title" className="font-display mt-4 text-5xl leading-[1.02] sm:text-7xl">
              Curated, never crowded.
            </h2>
            <p className="mt-5 text-lg text-mute">Every residence is independently verified, laser-measured and modelled. Narrow the world to your shortlist — instantly.</p>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-end" role="group" aria-label="Results view">
            {(["grid", "map"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`btn btn-sm ${view === v ? "btn-dark" : "btn-ghost-light"}`}>
                <Icon name={v === "grid" ? "layers" : "globe"} className="size-4" />
                {v === "grid" ? "Gallery" : "World map"}
              </button>
            ))}
          </div>
        </Reveal>

        {/* filter bar */}
        <Reveal delay={100} className="mt-10">
          <div className="glass-light rounded-[1.75rem] p-4 sm:p-6" role="search" aria-label="Filter residences">
            <div className="grid gap-4 lg:grid-cols-12">
              <label className="relative lg:col-span-4">
                <span className="sr-only">Search by name, city or architect</span>
                <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search city, name, architect…" className="field !pl-11" />
              </label>
              <label className="lg:col-span-3">
                <span className="sr-only">Property type</span>
                <select value={type} onChange={(e) => setType(e.target.value)} className="field">
                  {types.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <div className="lg:col-span-3">
                <label className="block">
                  <span className="mb-2.5 flex items-center justify-between text-xs text-mute">
                    <span>Budget up to</span>
                    <strong className="text-sm text-ink">{formatPrice(budget)}</strong>
                  </span>
                  <input type="range" min={minAll} max={maxAll} step={1_000_000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} style={{ "--p": `${pct}%` } as React.CSSProperties} aria-label="Maximum budget" />
                </label>
              </div>
              <label className="lg:col-span-2">
                <span className="sr-only">Sort results</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field">
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="size">Largest first</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
              {regions.map((r) => (
                <button key={r} type="button" aria-pressed={region === r} onClick={() => setRegion(r)} className={`rounded-full border px-4 py-2 text-xs font-medium transition ${region === r ? "border-ink bg-ink text-ivory" : "border-ink/15 bg-white/60 text-ink/75 hover:border-ink/40"}`}>
                  {r}
                </button>
              ))}
              <span className="mx-1 hidden h-6 w-px bg-ink/15 sm:block" />
              <div role="group" aria-label="Minimum bedrooms" className="flex items-center gap-1.5">
                {[0, 4, 5, 6].map((b) => (
                  <button key={b} type="button" aria-pressed={beds === b} onClick={() => setBeds(b)} className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${beds === b ? "border-gold-deep bg-gold/25 text-ink" : "border-ink/15 bg-white/60 text-ink/75 hover:border-ink/40"}`}>
                    {b === 0 ? "Any beds" : `${b}+ beds`}
                  </button>
                ))}
              </div>
              <button type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition ${savedOnly ? "border-gold-deep bg-gold/25" : "border-ink/15 bg-white/60 hover:border-ink/40"}`}>
                <Icon name="heart" className={`size-3.5 ${savedOnly ? "fill-current" : ""}`} />
                Shortlist ({saved.length})
              </button>
              <div className="ml-auto flex items-center gap-4 text-sm" aria-live="polite">
                <span className="text-mute">
                  <strong key={filtered.length} className="animate-card-in inline-block text-lg text-ink">
                    {filtered.length}
                  </strong>{" "}
                  {filtered.length === 1 ? "residence" : "residences"}
                </span>
                {dirty && (
                  <button type="button" onClick={reset} className="text-xs underline underline-offset-4 hover:text-gold-deep">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* results */}
        <div className="mt-10">
          {filtered.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-ink/20 p-14 text-center">
              <p className="font-display text-4xl">Nothing matches — yet.</p>
              <p className="mx-auto mt-3 max-w-md text-mute">Our most remarkable properties are often unlisted. Widen your criteria, or ask the Private Office about off-market opportunities.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={reset} className="btn btn-dark btn-sm">
                  Reset filters
                </button>
                <button onClick={() => openAccess("request")} className="btn btn-ghost-light btn-sm">
                  Request off-market access
                </button>
              </div>
            </div>
          ) : view === "grid" ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p, i) => (
                <li key={p.id}>
                  <Card p={p} i={i} saved={saved.includes(p.id)} onSave={() => toggleSaved(p.id)} onOpen={() => openStudio(p.id, "explore")} />
                </li>
              ))}
              {!unlocked && !savedOnly && teasers.length > 0 && (
                <li>
                  <button type="button" onClick={() => openAccess("request")} className="group animate-card-in relative flex aspect-[4/5] h-full w-full flex-col justify-between overflow-hidden rounded-[1.75rem] border border-gold/40 bg-gradient-to-br from-ink via-ink-3 to-[#2a2112] p-7 text-left text-ivory">
                    <div aria-hidden className="absolute -right-16 -top-16 size-60 rounded-full bg-gold/20 blur-3xl transition-transform duration-700 group-hover:scale-125" />
                    <Icon name="lock" className="relative size-8 text-gold" />
                    <div className="relative">
                      <p className="eyebrow text-gold-soft">Off-market</p>
                      <p className="font-display mt-3 text-4xl leading-tight">{teasers.length} estates you won&apos;t find here.</p>
                      <p className="mt-3 text-sm text-ivory/65">Unlisted. Unadvertised. Available to verified principals through the Private Office.</p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm text-gold-soft">
                        Request access <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </button>
                </li>
              )}
            </ul>
          ) : (
            <div className="relative overflow-hidden rounded-[1.75rem] border border-ink/10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.5)]">
              <AtriumMap properties={filtered} activeId={mapSel} onSelect={setMapSel} className="h-[62vh] min-h-[420px] lg:h-[640px]" />
              {selected && (
                <div className="glass animate-fade-up absolute inset-x-3 bottom-3 z-10 flex items-center gap-4 rounded-3xl p-3 !bg-ink/85 text-ivory sm:inset-x-auto sm:left-4 sm:bottom-4 sm:w-[24rem]">
                  <Image src={selected.image} alt="" width={96} height={96} sizes="80px" className="size-20 shrink-0 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-2xl leading-none">{selected.name}</p>
                    <p className="mt-1 truncate text-xs text-ivory/60">
                      {selected.city}, {selected.country}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-display text-xl text-gold-soft">{formatPrice(selected.price)}</span>
                      <button type="button" onClick={() => openStudio(selected.id, "map")} className="btn btn-gold btn-sm !min-h-9 !px-4">
                        Open <Icon name="arrow-up-right" className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <button type="button" aria-label="Dismiss" onClick={() => setMapSel(null)} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full hover:bg-white/10">
                    <Icon name="close" className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
