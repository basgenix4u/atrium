"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { Property } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { Icon } from "./Icons";

export interface Intel {
  status: "idle" | "loading" | "ready" | "error";
  buildings: number;
  roads: string[];
}

type LayerKey = "dark" | "streets" | "satellite";

const LAYERS: Record<LayerKey, { label: string; url: string; attribution: string; subdomains?: string; maxNativeZoom?: number }> = {
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
    subdomains: "abcd",
  },
  streets: {
    label: "Streets",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
    subdomains: "abcd",
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
    maxNativeZoom: 18,
  },
};
const LABELS_URL = "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";

const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];

interface OsmWay {
  type: string;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

async function overpass(query: string, signal: AbortSignal): Promise<{ elements: OsmWay[] }> {
  let last: unknown;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      return (await res.json()) as { elements: OsmWay[] };
    } catch (e) {
      if (signal.aborted) throw e;
      last = e;
    }
  }
  throw last;
}

function inside(lat: number, lng: number, ring: { lat: number; lon: number }[]) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.lat > lat !== b.lat > lat && lng < ((b.lon - a.lon) * (lat - a.lat)) / (b.lat - a.lat) + a.lon) c = !c;
  }
  return c;
}

export default function AtriumMap({
  properties,
  activeId,
  onSelect,
  onIntel,
  detail = false,
  className = "",
}: {
  properties: Property[];
  activeId: number | null;
  onSelect?: (id: number) => void;
  onIntel?: (i: Intel) => void;
  detail?: boolean;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const baseRef = useRef<Leaflet.TileLayer | null>(null);
  const labelRef = useRef<Leaflet.TileLayer | null>(null);
  const markersRef = useRef<Leaflet.LayerGroup | null>(null);
  const nbRef = useRef<Leaflet.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const onIntelRef = useRef(onIntel);
  onSelectRef.current = onSelect;
  onIntelRef.current = onIntel;

  const [ready, setReady] = useState(false);
  const [layer, setLayer] = useState<LayerKey>(detail ? "satellite" : "dark");
  const [intel, setIntelState] = useState<Intel>({ status: "idle", buildings: 0, roads: [] });
  const [retry, setRetry] = useState(0);

  const setIntel = (i: Intel) => {
    setIntelState(i);
    onIntelRef.current?.(i);
  };

  const target = useMemo(() => properties.find((p) => p.id === activeId) ?? null, [properties, activeId]);
  const idsKey = properties.map((p) => p.id).join(",");

  // init map
  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | undefined;
    (async () => {
      const mod = await import("leaflet");
      const L = (mod.default ?? mod) as typeof Leaflet;
      if (cancelled || !elRef.current) return;
      LRef.current = L;
      const map = L.map(elRef.current, { zoomControl: false, worldCopyJump: true, minZoom: 2, zoomSnap: 0.5, zoomDelta: 1 }).setView([30, 10], 2);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
      nbRef.current = L.layerGroup().addTo(map);
      markersRef.current = L.layerGroup().addTo(map);
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(elRef.current);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // base layer
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    baseRef.current?.remove();
    labelRef.current?.remove();
    const cfg = LAYERS[layer];
    baseRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, subdomains: cfg.subdomains ?? "abc", maxZoom: 19, maxNativeZoom: cfg.maxNativeZoom ?? 19 }).addTo(map);
    baseRef.current.bringToBack();
    if (layer === "satellite") {
      labelRef.current = L.tileLayer(LABELS_URL, { subdomains: "abcd", maxZoom: 19, pane: "overlayPane", opacity: 0.9 }).addTo(map);
    }
  }, [ready, layer]);

  // markers
  useEffect(() => {
    const L = LRef.current;
    const group = markersRef.current;
    if (!ready || !L || !group) return;
    group.clearLayers();
    const list = detail ? properties.filter((p) => p.id === activeId) : properties;
    for (const p of list) {
      const icon = L.divIcon({
        className: `atrium-pin ${p.id === activeId ? "active" : ""}`,
        html: `<span class="atrium-pin-ring"></span><span class="atrium-pin-core"></span><span class="atrium-pin-label">${formatPrice(p.price)}</span>`,
        iconSize: [0, 0],
      });
      const m = L.marker([p.lat, p.lng], { icon, title: `${p.name} — ${p.city}`, keyboard: true, riseOnHover: true }).addTo(group);
      m.on("click", () => onSelectRef.current?.(p.id));
    }
  }, [ready, properties, activeId, detail]);

  // overview framing
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map || detail || !properties.length) return;
    const b = L.latLngBounds(properties.map((p) => [p.lat, p.lng] as [number, number]));
    map.flyToBounds(b, { padding: [70, 70], maxZoom: properties.length === 1 ? 9 : 5, duration: 1.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, detail, idsKey]);

  // detail: fly + neighbourhood
  const lat = target?.lat;
  const lng = target?.lng;
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const nb = nbRef.current;
    if (!ready || !L || !map || !nb || !detail || lat === undefined || lng === undefined) return;
    nb.clearLayers();
    map.flyTo([lat, lng], 17, { duration: 1.6 });
    L.circle([lat, lng], { radius: 140, color: "#c9a766", weight: 1, dashArray: "4 7", fillColor: "#c9a766", fillOpacity: 0.05, interactive: false }).addTo(nb);

    const ctrl = new AbortController();
    setIntel({ status: "loading", buildings: 0, roads: [] });
    const q = `[out:json][timeout:20];(way["building"](around:330,${lat},${lng});way["highway"]["name"](around:450,${lat},${lng}););out geom 480;`;
    overpass(q, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        const buildings = data.elements.filter((e) => e.tags?.building && e.geometry && e.geometry.length >= 3).slice(0, 420);
        const roads = data.elements.filter((e) => e.tags?.highway && e.geometry && e.geometry.length >= 2);
        let home: OsmWay | null = null;
        let best = Infinity;
        for (const b of buildings) {
          const g = b.geometry!;
          if (inside(lat, lng, g)) {
            home = b;
            break;
          }
          const cLat = g.reduce((s, p) => s + p.lat, 0) / g.length;
          const cLng = g.reduce((s, p) => s + p.lon, 0) / g.length;
          const d = Math.hypot(cLat - lat, (cLng - lng) * Math.cos((lat * Math.PI) / 180)) * 111320;
          if (d < best && d < 90) {
            best = d;
            home = b;
          }
        }
        for (const r of roads) {
          const line = L.polyline(
            r.geometry!.map((p) => [p.lat, p.lon] as [number, number]),
            { color: "#e8d5a8", weight: 3, opacity: 0.55 },
          ).addTo(nb);
          if (r.tags?.name) line.bindTooltip(r.tags.name, { sticky: true });
        }
        for (const b of buildings) {
          const isHome = b === home;
          const poly = L.polygon(
            b.geometry!.map((p) => [p.lat, p.lon] as [number, number]),
            isHome
              ? { color: "#ffffff", weight: 2, fillColor: "#c9a766", fillOpacity: 0.55 }
              : { color: "#e8d5a8", weight: 1, fillColor: "#c9a766", fillOpacity: 0.16 },
          ).addTo(nb);
          if (isHome) poly.bindTooltip("Estate footprint", { permanent: false, direction: "top" });
          else if (b.tags?.name) poly.bindTooltip(b.tags.name, { sticky: true });
        }
        const counts = new Map<string, number>();
        for (const r of roads) {
          const n = r.tags?.name;
          if (n) counts.set(n, (counts.get(n) ?? 0) + 1);
        }
        const names = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n).slice(0, 8);
        setIntel({ status: "ready", buildings: buildings.length, roads: names });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setIntel({ status: "error", buildings: 0, roads: [] });
      });
    return () => ctrl.abort();
  }, [ready, detail, lat, lng, retry]);

  const zoomTo = (z: number) => {
    if (target) mapRef.current?.flyTo([target.lat, target.lng], z, { duration: 1.2 });
  };

  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      <div ref={elRef} className="absolute inset-0 z-0" role="application" aria-label={detail && target ? `Map showing ${target.name}` : "Map of all residences"} />
      {!ready && (
        <div className="absolute inset-0 z-[1] grid place-items-center bg-ink-2 text-sm text-ivory/50">
          <span className="flex items-center gap-3">
            <span className="size-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" /> Loading map…
          </span>
        </div>
      )}
      <div className="absolute left-3 top-3 z-[1001] flex flex-wrap gap-1.5">
        <div role="group" aria-label="Map style" className="glass flex rounded-full p-1 text-xs !bg-ink/75">
          {(Object.keys(LAYERS) as LayerKey[]).map((k) => (
            <button key={k} type="button" aria-pressed={layer === k} onClick={() => setLayer(k)} className={`rounded-full px-3 py-1.5 text-ivory/80 transition ${layer === k ? "!bg-gold !text-ink" : "hover:text-ivory"}`}>
              {LAYERS[k].label}
            </button>
          ))}
        </div>
        {detail && (
          <div role="group" aria-label="Zoom level" className="glass flex rounded-full p-1 text-xs !bg-ink/75">
            {[
              ["Estate", 18],
              ["Neighbourhood", 15.5],
              ["Region", 11],
            ].map(([l, z]) => (
              <button key={l} type="button" onClick={() => zoomTo(z as number)} className="rounded-full px-3 py-1.5 text-ivory/80 transition hover:bg-white/10 hover:text-ivory">
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
      {detail && intel.status === "loading" && (
        <div className="glass absolute bottom-3 left-3 z-[1001] flex items-center gap-2 rounded-full px-3.5 py-2 text-xs text-ivory/80 !bg-ink/75" role="status">
          <span className="size-3 animate-spin rounded-full border-2 border-gold/30 border-t-gold" /> Scanning neighbourhood…
        </div>
      )}
      {detail && intel.status === "error" && (
        <div className="glass absolute bottom-3 left-3 z-[1001] flex items-center gap-3 rounded-full px-3.5 py-2 text-xs text-ivory/80 !bg-ink/75" role="status">
          Live neighbourhood data unavailable.
          <button type="button" onClick={() => setRetry((r) => r + 1)} className="inline-flex items-center gap-1 text-gold-soft underline-offset-2 hover:underline">
            <Icon name="compass" className="size-3.5" /> Retry
          </button>
        </div>
      )}
    </div>
  );
}
