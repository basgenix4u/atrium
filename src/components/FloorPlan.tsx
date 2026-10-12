"use client";

import { useMemo, useState } from "react";
import { computeLayout, SQM_TO_SQFT, WALL_EXT, WALL_INT, type RoomLayout } from "@/lib/layout";
import type { Property } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { Icon } from "./Icons";

const FILL: Record<string, string> = {
  living: "#efe4cd",
  kitchen: "#ece6da",
  dining: "#efe4cd",
  bedroom: "#e9e4d8",
  master: "#e7dfcb",
  bath: "#d9e6e8",
  entry: "#f1ead9",
  library: "#e6dcc6",
  cinema: "#d8d6dc",
  spa: "#d3e4e6",
  gym: "#dfe0e0",
  wine: "#e1d3cb",
  garage: "#dcdcd9",
  office: "#e6dfd0",
  lounge: "#efe4cd",
  gallery: "#f1ead9",
  kids: "#efe6d2",
  pool: "#cfe6ec",
  staff: "#e2e0da",
  terrace: "#e4e8da",
};
const PAPER = "#faf8f3";
const INK = "#1b1b1f";

export function FloorPlan({ property, onViewRoom }: { property: Property; onViewRoom: (roomId: string) => void }) {
  const layout = useMemo(() => computeLayout(property.model), [property.model]);
  const [floorIdx, setFloorIdx] = useState(layout.groundIndex);
  const [unit, setUnit] = useState<"m" | "ft">("m");
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const idx = Math.min(floorIdx, layout.floors.length - 1);
  const fl = layout.floors[idx];
  const ex = layout.extents;
  const m = 2.2;
  const vb = { x: ex.minX - m, y: ex.minZ - m, w: ex.maxX - ex.minX + m * 2, h: ex.maxZ - ex.minZ + m * 2 + 1.6 };
  const rooms: RoomLayout[] = [...fl.rooms, ...(fl.terraceRoom ? [fl.terraceRoom] : [])];
  const sel = rooms.find((r) => r.id === (selected ?? hover));
  const dim = (v: number) => (unit === "m" ? `${v.toFixed(1)}` : `${(v * 3.2808).toFixed(1)}`);
  const area = (v: number) => (unit === "m" ? `${formatNumber(v)} m²` : `${formatNumber(v * SQM_TO_SQFT)} sq ft`);
  const unitLabel = unit === "m" ? "m" : "ft";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white shadow-[0_30px_80px_-40px_rgba(60,40,10,0.4)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
          <div role="tablist" aria-label="Floor level" className="flex flex-wrap gap-1.5">
            {[...layout.floors].reverse().map((f) => (
              <button
                key={f.index}
                role="tab"
                aria-selected={f.index === idx}
                onClick={() => {
                  setFloorIdx(f.index);
                  setSelected(null);
                }}
                className={`rounded-full px-3.5 py-2 text-xs font-medium transition ${f.index === idx ? "bg-ink text-ivory" : "bg-ink/5 text-ink/70 hover:bg-ink/10"}`}
              >
                {f.name}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Units" className="flex rounded-full bg-ink/5 p-1 text-xs">
            {(["m", "ft"] as const).map((u) => (
              <button key={u} aria-pressed={unit === u} onClick={() => setUnit(u)} className={`rounded-full px-3 py-1.5 transition ${unit === u ? "bg-white shadow" : "text-ink/60"}`}>
                {u === "m" ? "Metres" : "Feet"}
              </button>
            ))}
          </div>
        </div>

        <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className="block h-auto w-full" style={{ background: PAPER }} role="img" aria-label={`Floor plan of ${fl.name}, ${property.name}`}>
          <defs>
            <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
              <path d="M1 0H0V1" fill="none" stroke="#e9e3d6" strokeWidth="0.03" />
            </pattern>
            <pattern id="hatch" width="0.6" height="0.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="0.6" stroke="#c9c2b0" strokeWidth="0.06" />
            </pattern>
          </defs>
          <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#grid)" />

          {/* slab / terrace */}
          <rect x={fl.slab.x} y={fl.slab.z} width={fl.slab.w} height={fl.slab.d} fill="url(#hatch)" opacity={fl.terrace ? 0.6 : 0} />

          {/* rooms */}
          {rooms.map((r) => {
            const active = r.id === sel?.id;
            const chosen = r.id === selected;
            const nameSize = Math.max(0.3, Math.min(0.62, (r.w - 0.5) / (r.name.length * 0.5)));
            return (
              <g
                key={r.id}
                tabIndex={0}
                role="button"
                aria-label={`${r.name}, ${r.w.toFixed(1)} by ${r.d.toFixed(1)} metres`}
                aria-pressed={chosen}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setHover(r.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(r.id)}
                onBlur={() => setHover(null)}
                onClick={() => setSelected(chosen ? null : r.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(chosen ? null : r.id))}
              >
                <rect x={r.x} y={r.z} width={r.w} height={r.d} fill={FILL[r.kind] ?? "#eee"} opacity={r.kind === "terrace" ? 0.8 : 1} />
                <rect x={r.x} y={r.z} width={r.w} height={r.d} fill="#c9a766" opacity={active ? 0.38 : 0} style={{ transition: "opacity .25s" }} />
                {r.d >= 1.6 && r.w >= 2 && (
                  <>
                    <text x={r.x + r.w / 2} y={r.z + r.d / 2 - 0.05} textAnchor="middle" fontSize={nameSize} fill={INK} fontWeight={600} style={{ fontFamily: "var(--font-sans)", pointerEvents: "none" }}>
                      {r.name}
                    </text>
                    <text x={r.x + r.w / 2} y={r.z + r.d / 2 + nameSize * 0.95} textAnchor="middle" fontSize={nameSize * 0.72} fill="#6f6b64" style={{ fontFamily: "var(--font-sans)", pointerEvents: "none" }}>
                      {dim(r.w)} × {dim(r.d)} {unitLabel}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* pool */}
          {layout.pool && layout.pool.floor === idx && (
            <g pointerEvents="none">
              <rect x={layout.pool.x - 0.3} y={layout.pool.z - 0.3} width={layout.pool.w + 0.6} height={layout.pool.d + 0.6} fill="#fff" stroke={INK} strokeWidth={0.06} />
              <rect x={layout.pool.x} y={layout.pool.z} width={layout.pool.w} height={layout.pool.d} fill="#8fd0de" />
              <text x={layout.pool.x + layout.pool.w / 2} y={layout.pool.z + layout.pool.d / 2 + 0.15} textAnchor="middle" fontSize={0.45} fill="#17667a" fontWeight={600} style={{ fontFamily: "var(--font-sans)" }}>
                Pool {dim(layout.pool.w)} × {dim(layout.pool.d)} {unitLabel}
              </text>
            </g>
          )}

          {/* walls */}
          <g stroke={INK} strokeLinecap="square" pointerEvents="none">
            {fl.walls.map((w, i) => (
              <line key={i} x1={w.x1} y1={w.z1} x2={w.x2} y2={w.z2} strokeWidth={w.exterior ? WALL_EXT : WALL_INT} />
            ))}
          </g>

          {/* openings */}
          <g pointerEvents="none">
            {fl.walls.flatMap((w, wi) =>
              w.openings.map((o, oi) => {
                const vertical = w.x1 === w.x2;
                const th = (w.exterior ? WALL_EXT : WALL_INT) + 0.05;
                const wd = o.to - o.from;
                const key = `${wi}-${oi}`;
                const gap = vertical ? <rect x={w.x1 - th / 2} y={o.from} width={th} height={wd} fill={PAPER} /> : <rect x={o.from} y={w.z1 - th / 2} width={wd} height={th} fill={PAPER} />;
                if (o.kind === "arch") return <g key={key}>{gap}</g>;
                if (o.kind === "window" || o.kind === "slider" || o.kind === "garage") {
                  const off = th / 3;
                  return (
                    <g key={key}>
                      {gap}
                      {vertical ? (
                        <>
                          <line x1={w.x1 - off} y1={o.from} x2={w.x1 - off} y2={o.to} stroke={INK} strokeWidth={0.05} />
                          <line x1={w.x1 + off} y1={o.from} x2={w.x1 + off} y2={o.to} stroke={INK} strokeWidth={0.05} />
                        </>
                      ) : (
                        <>
                          <line x1={o.from} y1={w.z1 - off} x2={o.to} y2={w.z1 - off} stroke={o.kind === "garage" ? "#8a6f3c" : INK} strokeWidth={o.kind === "garage" ? 0.12 : 0.05} />
                          <line x1={o.from} y1={w.z1 + off} x2={o.to} y2={w.z1 + off} stroke={INK} strokeWidth={0.05} />
                        </>
                      )}
                    </g>
                  );
                }
                // door swing
                const r = o.kind === "main" ? wd / 2 : wd;
                const sw = (o.kind === "main" || vertical ? 0 : 1) as 0 | 1;
                const arcs = [];
                const dir = w.side === "n" ? -1 : 1;
                if (vertical) {
                  const sgn = o.kind === "main" ? (w.side === "w" ? -1 : 1) : 1;
                  arcs.push(
                    <path key="a" d={`M ${w.x1} ${o.to} A ${r} ${r} 0 0 ${sw} ${w.x1 + r * sgn} ${o.from}`} fill="none" stroke="#8a6f3c" strokeWidth={0.04} />,
                    <line key="l" x1={w.x1} y1={o.from} x2={w.x1 + r * sgn} y2={o.from} stroke={INK} strokeWidth={0.06} />,
                  );
                } else {
                  const d2 = o.kind === "main" ? dir : 1;
                  arcs.push(
                    <path key="a" d={`M ${o.to} ${w.z1} A ${r} ${r} 0 0 ${d2 === 1 ? 1 : 0} ${o.from} ${w.z1 + r * d2}`} fill="none" stroke="#8a6f3c" strokeWidth={0.04} />,
                    <line key="l" x1={o.from} y1={w.z1} x2={o.from} y2={w.z1 + r * d2} stroke={INK} strokeWidth={0.06} />,
                  );
                  if (o.kind === "main") {
                    arcs.push(
                      <path key="a2" d={`M ${o.from} ${w.z1} A ${r} ${r} 0 0 ${d2 === 1 ? 0 : 1} ${o.to} ${w.z1 + r * d2}`} fill="none" stroke="#8a6f3c" strokeWidth={0.04} />,
                      <line key="l2" x1={o.to} y1={w.z1} x2={o.to} y2={w.z1 + r * d2} stroke={INK} strokeWidth={0.06} />,
                    );
                  }
                }
                return (
                  <g key={key}>
                    {gap}
                    {arcs}
                  </g>
                );
              }),
            )}
          </g>

          {/* north arrow + scale */}
          <g transform={`translate(${ex.maxX + 0.2}, ${ex.minZ - 0.4})`} pointerEvents="none">
            <circle r={0.9} fill="none" stroke={INK} strokeWidth={0.05} />
            <path d="M0 -0.8L0.28 0.35L0 0.15L-0.28 0.35Z" fill={INK} />
            <text y={-1.1} textAnchor="middle" fontSize={0.5} fill={INK} fontWeight={700} style={{ fontFamily: "var(--font-sans)" }}>
              N
            </text>
          </g>
          <g transform={`translate(${ex.minX}, ${ex.maxZ + 1.4})`} pointerEvents="none">
            <rect width={5} height={0.18} fill={INK} />
            <rect x={2.5} width={2.5} height={0.18} fill={PAPER} stroke={INK} strokeWidth={0.03} />
            <text y={0.7} fontSize={0.42} fill={INK} style={{ fontFamily: "var(--font-sans)" }}>
              {unit === "m" ? "0 — 5 m" : "0 — 16.4 ft"}
            </text>
          </g>
        </svg>
      </div>

      <aside className="flex flex-col gap-4" aria-label="Room schedule">
        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-5">
          <p className="eyebrow text-gold-deep">{fl.name}</p>
          <h3 className="font-display mt-1 text-3xl">{sel ? sel.name : "Select a room"}</h3>
          {sel ? (
            <>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-mute">Dimensions</dt>
                  <dd className="font-medium">
                    {dim(sel.w)} × {dim(sel.d)} {unitLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-mute">Area</dt>
                  <dd className="font-medium">{area(sel.area)}</dd>
                </div>
              </dl>
              <button type="button" onClick={() => onViewRoom(sel.id)} className="btn btn-dark btn-sm mt-4 w-full">
                <Icon name="cube" className="size-4 text-gold" /> View this room in 3D
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm text-mute">Hover or tap any room to see its dimensions and jump straight into the 3D model.</p>
          )}
        </div>

        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-5">
          <h3 className="text-sm font-medium">Area schedule</h3>
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">Rooms on {fl.name}</caption>
            <tbody>
              {rooms.map((r) => (
                <tr
                  key={r.id}
                  onMouseEnter={() => setHover(r.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(r.id === selected ? null : r.id)}
                  className={`cursor-pointer border-t border-ink/5 transition ${r.id === sel?.id ? "bg-gold/15" : "hover:bg-ink/[0.03]"}`}
                >
                  <th scope="row" className="py-2 pr-2 text-left font-normal">
                    {r.name}
                  </th>
                  <td className="py-2 text-right tabular-nums text-mute">{area(r.area)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-ink/20 font-medium">
                <th scope="row" className="py-2.5 pr-2 text-left">
                  Level total
                </th>
                <td className="py-2.5 text-right tabular-nums">{area(fl.area)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 border-t border-ink/10 pt-3 text-xs text-mute">
            Whole residence: <strong className="text-ink">{area(layout.totalArea)}</strong> internal · {area(layout.terraceArea)} external terraces.
          </p>
        </div>
      </aside>
    </div>
  );
}
