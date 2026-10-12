"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Layout } from "@/lib/layout";
import type { Property } from "@/lib/types";
import { ViewerEngine, type ObjectInfo, type TimeOfDay, type ViewState } from "@/lib/viewer/engine";
import { Icon, type IconName } from "./Icons";

export interface ViewerApi {
  flyToRoom: (id: string) => void;
}

function Toggle({ icon, label, on, onClick, disabled, hint }: { icon: IconName; label: string; on: boolean; onClick: () => void; disabled?: boolean; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      disabled={disabled}
      title={hint}
      className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${
        on ? "border-gold bg-gold/15 text-gold-soft" : "border-white/10 bg-white/[0.03] text-ivory/75 hover:border-white/25 hover:bg-white/[0.07]"
      }`}
    >
      <Icon name={icon} className="size-4 shrink-0" />
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function SideSection({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="border-b border-white/10 p-4 last:border-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="eyebrow !text-[0.66rem] text-gold-soft">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function HoldPad({ icon, label, onHold }: { icon: IconName; label: string; onHold: (down: boolean) => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onLostPointerCapture={() => onHold(false)}
      className="glass grid size-12 touch-none select-none place-items-center rounded-2xl !bg-ink/70 text-ivory active:!bg-gold active:text-ink"
    >
      <Icon name={icon} />
    </button>
  );
}

const TIMES: { v: TimeOfDay; icon: IconName; label: string }[] = [
  { v: "day", icon: "sun", label: "Day" },
  { v: "dusk", icon: "dusk", label: "Dusk" },
  { v: "night", icon: "moon", label: "Night" },
];

export default function Viewer3D({ property, onEnquire, registerApi }: { property: Property; onEnquire: () => void; registerApi: (api: ViewerApi | null) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engRef = useRef<ViewerEngine | null>(null);
  const [st, setSt] = useState<ViewState | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [objects, setObjects] = useState<ObjectInfo[]>([]);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [help, setHelp] = useState(true);
  const keys = useRef({ f: 0, b: 0, l: 0, r: 0 });

  // engine lifecycle
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    try {
      const eng = new ViewerEngine(host, { onState: setSt });
      engRef.current = eng;
      registerApi({ flyToRoom: (id) => eng.flyToRoom(id) });
    } catch {
      setFailed(true);
    }
    return () => {
      registerApi(null);
      engRef.current?.dispose();
      engRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // model switching
  useEffect(() => {
    const eng = engRef.current;
    if (!eng) return;
    eng.load(property.model);
    setLayout(eng.getLayout());
    setObjects(eng.getObjects());
  }, [property.id, property.model]);

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && engRef.current?.state.mode !== "walk" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const eng = engRef.current;
  const g = layout?.groundIndex ?? 0;
  const curFloor = st?.floor ?? g;
  const fl = layout?.floors[curFloor];
  const floorRooms = useMemo(() => (fl ? [...fl.rooms, ...(fl.terraceRoom ? [fl.terraceRoom] : [])] : []), [fl]);
  const floorObjects = objects.filter((o) => o.floor === curFloor);
  const activeObj = objects.find((o) => o.id === st?.objectId);
  const walking = st?.mode === "walk";
  const curRoom = floorRooms.find((r) => r.id === st?.roomId);

  const pad = (axis: "f" | "b" | "l" | "r") => (down: boolean) => {
    keys.current[axis] = down ? 1 : 0;
    const k = keys.current;
    eng?.setMoveInput(k.f - k.b, k.r - k.l);
  };

  const crumb = "rounded-full px-3 py-1.5 transition hover:bg-white/10";

  return (
    <div className={expanded ? "fixed inset-0 z-[80] bg-ink p-0" : "relative"}>
      <div className={`grid overflow-hidden border border-white/10 bg-ink-2 text-ivory ${expanded ? "h-full grid-rows-[1fr_auto] rounded-none lg:grid-cols-[1fr_21rem] lg:grid-rows-1" : "rounded-[1.75rem] lg:grid-cols-[1fr_21rem]"}`}>
        {/* viewport */}
        <div className={`relative min-w-0 ${expanded ? "h-full min-h-0" : "h-[64vh] min-h-[440px] lg:h-[700px]"}`}>
          <div ref={hostRef} className="absolute inset-0 touch-none bg-gradient-to-b from-[#1a2236] to-[#0b0d14]" aria-label={`Interactive 3D model of ${property.name}. Drag to orbit, scroll to zoom.`} role="application" />

          {failed && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-ink-2 p-8 text-center">
              <div>
                <Image src={property.image} alt={property.name} width={1408} height={768} sizes="(max-width: 448px) 100vw, 448px" className="mx-auto mb-5 h-44 w-full max-w-md rounded-2xl object-cover opacity-80" />
                <p className="font-display text-2xl">3D viewing needs WebGL.</p>
                <p className="mt-2 text-sm text-ivory/60">Your browser or device has WebGL disabled. Enable hardware acceleration, or request a guided video tour from an advisor.</p>
                <button className="btn btn-gold btn-sm mt-5" onClick={onEnquire}>
                  Request a guided tour
                </button>
              </div>
            </div>
          )}
          {!st?.ready && !failed && (
            <div className="absolute inset-0 z-10 grid place-items-center text-sm text-ivory/60" role="status">
              <span className="flex items-center gap-3">
                <span className="size-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" /> Building the digital twin…
              </span>
            </div>
          )}

          {/* top-left: breadcrumbs */}
          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2">
            <nav aria-label="3D view position" className="pointer-events-auto glass flex flex-wrap items-center gap-0.5 rounded-full p-1 text-xs !bg-ink/70">
              <button type="button" onClick={() => eng?.showExterior()} className={`${crumb} ${st?.mode === "exterior" ? "bg-gold !text-ink" : "text-ivory/85"}`}>
                Exterior
              </button>
              {st && st.floor !== null && fl && (
                <>
                  <span className="text-ivory/30">/</span>
                  <button type="button" onClick={() => eng?.focusFloor(st.floor!)} className={`${crumb} ${st.mode === "floor" ? "bg-gold !text-ink" : "text-ivory/85"}`}>
                    {fl.name}
                  </button>
                </>
              )}
              {st && st.roomId && st.mode !== "floor" && curRoom && (
                <>
                  <span className="text-ivory/30">/</span>
                  <span className={`${crumb} ${st.mode === "room" ? "bg-gold !text-ink" : "text-ivory/85"} hover:!bg-transparent`} aria-current="location">
                    {curRoom.name}
                  </span>
                </>
              )}
            </nav>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <div role="group" aria-label="Time of day" className="glass flex rounded-full p-1 !bg-ink/70">
                {TIMES.map((t) => (
                  <button key={t.v} type="button" aria-label={t.label} aria-pressed={st?.time === t.v} title={t.label} onClick={() => eng?.setTime(t.v)} className={`grid size-9 place-items-center rounded-full transition ${st?.time === t.v ? "bg-gold text-ink" : "text-ivory/80 hover:bg-white/10"}`}>
                    <Icon name={t.icon} className="size-4" />
                  </button>
                ))}
              </div>
              <button type="button" aria-label={expanded ? "Exit full view" : "Expand viewer"} onClick={() => setExpanded((v) => !v)} className="glass grid size-11 place-items-center rounded-full !bg-ink/70 text-ivory/90 hover:!bg-white/15">
                <Icon name={expanded ? "close" : "expand"} className="size-4" />
              </button>
            </div>
          </div>

          {/* bottom: presets */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-col items-center gap-2">
            {activeObj && (
              <div className="pointer-events-auto glass animate-fade-up w-full max-w-md rounded-3xl p-4 !bg-ink/80" role="region" aria-label="Object details">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow !text-[0.62rem] text-gold-soft">
                      {activeObj.roomName} · inspecting
                    </p>
                    <h4 className="font-display mt-1 text-2xl leading-tight">{activeObj.name}</h4>
                  </div>
                  <button type="button" aria-label="Close details" onClick={() => eng?.selectObject(null)} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-white/10">
                    <Icon name="close" className="size-4" />
                  </button>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ivory/70">{activeObj.desc}</p>
              </div>
            )}

            {walking && (
              <div className="pointer-events-auto flex w-full items-end justify-between">
                <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Movement controls">
                  <span />
                  <HoldPad icon="up" label="Walk forward" onHold={pad("f")} />
                  <span />
                  <HoldPad icon="left" label="Step left" onHold={pad("l")} />
                  <HoldPad icon="down" label="Walk backward" onHold={pad("b")} />
                  <HoldPad icon="right" label="Step right" onHold={pad("r")} />
                </div>
                <div className="glass hidden max-w-[14rem] rounded-2xl p-3 text-[0.7rem] leading-relaxed text-ivory/70 !bg-ink/70 sm:block">
                  <strong className="text-gold-soft">Walking.</strong> WASD / arrows to move · Shift to run · drag to look · Esc to exit. Doors open as you approach.
                </div>
              </div>
            )}

            <div className="pointer-events-auto glass flex flex-wrap items-center justify-center gap-1 rounded-full p-1 text-xs !bg-ink/75">
              {walking ? (
                <>
                  {layout?.floors
                    .slice()
                    .reverse()
                    .map((f) => (
                      <button key={f.index} type="button" onClick={() => eng?.walkToFloor(f.index)} aria-pressed={st?.floor === f.index} className={`rounded-full px-3 py-2 transition ${st?.floor === f.index ? "bg-gold text-ink" : "text-ivory/80 hover:bg-white/10"}`}>
                        {f.name.split(" · ")[0]}
                      </button>
                    ))}
                  <button type="button" onClick={() => eng?.exitWalk()} className="rounded-full bg-white/10 px-4 py-2 font-medium hover:bg-white/20">
                    Exit walk
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => eng?.showExterior(false)} className="rounded-full px-3.5 py-2 text-ivory/85 transition hover:bg-white/10">
                    <Icon name="building" className="mr-1.5 inline size-4 align-[-3px]" />
                    Exterior
                  </button>
                  <button type="button" onClick={() => eng?.showExterior(true)} className="rounded-full px-3.5 py-2 text-ivory/85 transition hover:bg-white/10">
                    <Icon name="compass" className="mr-1.5 inline size-4 align-[-3px]" />
                    Aerial
                  </button>
                  <button type="button" onClick={() => eng?.focusFloor(g)} className="rounded-full px-3.5 py-2 text-ivory/85 transition hover:bg-white/10">
                    <Icon name="layers" className="mr-1.5 inline size-4 align-[-3px]" />
                    Cutaway
                  </button>
                  <button type="button" onClick={() => eng?.enterWalk()} className="rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:brightness-110">
                    <Icon name="person" className="mr-1.5 inline size-4 align-[-3px]" />
                    Enter &amp; walk
                  </button>
                </>
              )}
            </div>
          </div>

          {/* help */}
          {help && st?.mode === "exterior" && st.ready && (
            <div className="glass pointer-events-auto absolute left-3 top-16 z-10 hidden max-w-[16rem] rounded-2xl p-3.5 text-[0.72rem] leading-relaxed text-ivory/75 !bg-ink/70 sm:block">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="eyebrow !text-[0.6rem] text-gold-soft">How to explore</span>
                <button type="button" aria-label="Dismiss tips" onClick={() => setHelp(false)} className="-mr-1 grid size-6 place-items-center rounded-full hover:bg-white/10">
                  <Icon name="close" className="size-3.5" />
                </button>
              </div>
              <ul className="space-y-1">
                <li>Drag to orbit · scroll or pinch to zoom · right-drag to pan</li>
                <li>
                  <strong className="text-ivory">Click a floor</strong> to open it, then a room, then an object
                </li>
                <li>Use the panel to explode, hide, lift the roof or open the glass</li>
              </ul>
            </div>
          )}
        </div>

        {/* sidebar */}
        <aside className={`thin-scroll min-h-0 overflow-y-auto border-t border-white/10 bg-ink lg:border-l lg:border-t-0 ${expanded ? "max-h-[38dvh] lg:max-h-none" : "lg:h-[700px]"}`} aria-label="Model controls">
          <SideSection
            title="Levels"
            aside={
              <button type="button" onClick={() => eng?.showExterior()} className="text-[0.7rem] text-ivory/60 underline-offset-2 hover:text-gold-soft hover:underline">
                Reset view
              </button>
            }
          >
            <ul className="grid gap-1.5">
              {layout?.floors
                .slice()
                .reverse()
                .map((f) => {
                  const hidden = st?.hidden.includes(f.index);
                  const active = st?.floor === f.index;
                  return (
                    <li key={f.index} className={`flex items-center gap-1 rounded-2xl border pl-1 pr-1.5 transition ${active ? "border-gold bg-gold/10" : "border-white/10 bg-white/[0.03]"}`}>
                      <button type="button" aria-pressed={!!hidden} aria-label={`${hidden ? "Show" : "Hide"} ${f.name}`} title={hidden ? "Show level" : "Hide level"} onClick={() => eng?.toggleFloorHidden(f.index)} className="grid size-9 place-items-center rounded-full text-ivory/70 hover:bg-white/10 hover:text-ivory">
                        <Icon name={hidden ? "eye-off" : "eye"} className="size-4" />
                      </button>
                      <button type="button" onClick={() => eng?.focusFloor(f.index)} className="min-w-0 flex-1 py-2.5 text-left">
                        <span className={`block truncate text-sm ${hidden ? "line-through opacity-50" : ""}`}>{f.name}</span>
                        <span className="text-[0.68rem] text-ivory/45">
                          {f.rooms.length} rooms · {f.area} m²
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </SideSection>

          <SideSection title="Architecture">
            <label className="mb-3 block text-xs text-ivory/75">
              <span className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon name="exploded" className="size-4 text-gold" /> Exploded view
                </span>
                <span className="tabular-nums text-ivory/50">{Math.round((st?.explode ?? 0) * 100)}%</span>
              </span>
              <input type="range" min={0} max={100} value={Math.round((st?.explode ?? 0) * 100)} onChange={(e) => eng?.setExplode(Number(e.target.value) / 100)} style={{ "--p": `${(st?.explode ?? 0) * 100}%` } as React.CSSProperties} aria-label="Exploded view amount" />
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <Toggle icon="xray" label="X-ray walls" on={!!st?.xray} onClick={() => eng?.setXray(!st?.xray)} />
              <Toggle icon="roof" label="Lift the roof" on={!!st?.roofLifted} onClick={() => eng?.setRoofLifted(!st?.roofLifted)} />
              <Toggle icon="door" label="Open the glass" on={!!st?.facadeOpen} onClick={() => eng?.setFacadeOpen(!st?.facadeOpen)} />
              <Toggle icon="layers" label="Isolate level" on={!!st?.isolate} disabled={st?.mode !== "floor"} hint="Open a level first" onClick={() => eng?.setIsolate(!st?.isolate)} />
            </div>
          </SideSection>

          <SideSection title={fl ? `Rooms · ${fl.name}` : "Rooms"}>
            <ul className="grid gap-1">
              {floorRooms.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => eng?.flyToRoom(r.id)}
                    onMouseEnter={() => eng?.highlightRoom(r.id)}
                    onMouseLeave={() => eng?.highlightRoom(null)}
                    onFocus={() => eng?.highlightRoom(r.id)}
                    onBlur={() => eng?.highlightRoom(null)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${st?.roomId === r.id ? "bg-gold/15 text-gold-soft" : "text-ivory/80 hover:bg-white/[0.06]"}`}
                  >
                    <span className="truncate">{r.name}</span>
                    <span className="shrink-0 text-[0.68rem] tabular-nums text-ivory/45">
                      {r.w.toFixed(1)} × {r.d.toFixed(1)} m
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </SideSection>

          {floorObjects.length > 0 && (
            <SideSection title="Inspect objects">
              <ul className="grid gap-1">
                {floorObjects.map((o) => (
                  <li key={o.id}>
                    <button type="button" onClick={() => eng?.flyToObject(o.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${st?.objectId === o.id ? "bg-gold/15 text-gold-soft" : "text-ivory/80 hover:bg-white/[0.06]"}`}>
                      <span className="size-1.5 shrink-0 rounded-full bg-gold" />
                      <span className="min-w-0 flex-1 truncate">{o.name}</span>
                      <Icon name="arrow-right" className="size-3.5 shrink-0 text-ivory/40" />
                    </button>
                  </li>
                ))}
              </ul>
            </SideSection>
          )}

          <div className="p-4">
            <button type="button" onClick={onEnquire} className="btn btn-gold w-full">
              Request a private viewing
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
