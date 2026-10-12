import type { ModelSpec, RoomKind, RoomSpec } from "./types";

export interface Rect {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface RoomLayout extends Rect {
  id: string;
  floor: number;
  kind: RoomKind;
  name: string;
  area: number;
}

export type OpeningKind = "door" | "arch" | "window" | "slider" | "main" | "garage";

export interface Opening {
  from: number;
  to: number;
  kind: OpeningKind;
  sill: number;
  head: number;
}

export interface WallSeg {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  exterior: boolean;
  openings: Opening[];
  side?: "n" | "s" | "e" | "w";
}

export interface FloorLayout {
  index: number;
  name: string;
  height: number;
  /** walking-surface elevation relative to the ground floor */
  y: number;
  rect: Rect;
  slab: Rect;
  terrace: number;
  rooms: RoomLayout[];
  terraceRoom: RoomLayout | null;
  walls: WallSeg[];
  area: number;
}

export interface Layout {
  floors: FloorLayout[];
  groundIndex: number;
  elevation: number;
  totalArea: number;
  terraceArea: number;
  pool: (Rect & { floor: number }) | null;
  extents: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number };
}

export const WALL_EXT = 0.34;
export const WALL_INT = 0.16;
export const SLAB = 0.36;

const WEIGHTS: Record<RoomKind, number> = {
  living: 3.2,
  kitchen: 1.8,
  dining: 2,
  bedroom: 1.9,
  master: 3.4,
  bath: 0.9,
  entry: 1.3,
  library: 1.5,
  cinema: 2.2,
  spa: 2.4,
  gym: 1.7,
  wine: 1.1,
  garage: 3.2,
  office: 1.4,
  lounge: 2.4,
  gallery: 1.9,
  kids: 1.7,
  pool: 3.4,
  staff: 1.3,
  terrace: 1,
};

const SOCIAL = new Set<RoomKind>(["living", "kitchen", "dining", "lounge", "gallery", "entry"]);
const GLASS_ROOMS = new Set<RoomKind>(["living", "dining", "master", "lounge", "pool", "gallery", "spa"]);
const BLIND_ROOMS = new Set<RoomKind>(["cinema", "wine"]);
const SMALL_WINDOW = new Set<RoomKind>(["bath", "staff"]);

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

interface Item {
  r: RoomSpec;
  idx: number;
}

interface Ctx {
  floor: number;
  walls: WallSeg[];
  rng: () => number;
}

function partition(rect: Rect, items: Item[], ctx: Ctx): RoomLayout[] {
  if (items.length === 1) {
    const it = items[0];
    return [
      {
        ...rect,
        id: `f${ctx.floor}-r${it.idx}`,
        floor: ctx.floor,
        kind: it.r.kind,
        name: it.r.name,
        area: Math.round(rect.w * rect.d * 10) / 10,
      },
    ];
  }
  const weights = items.map((it) => it.r.weight ?? WEIGHTS[it.r.kind]);
  const total = weights.reduce((a, b) => a + b, 0);
  let k = 1;
  let best = Infinity;
  let acc = 0;
  for (let i = 1; i < items.length; i++) {
    acc += weights[i - 1];
    const diff = Math.abs(acc - total / 2);
    if (diff < best) {
      best = diff;
      k = i;
    }
  }
  const lw = weights.slice(0, k).reduce((a, b) => a + b, 0);
  const ratio = lw / total;
  const vertical = rect.w >= rect.d;
  let A: Rect;
  let B: Rect;
  let wall: WallSeg;
  if (vertical) {
    const min = Math.min(2.6, rect.w / 3);
    const wa = Math.min(Math.max(r1(rect.w * ratio), min), rect.w - min);
    A = { x: rect.x, z: rect.z, w: wa, d: rect.d };
    B = { x: rect.x + wa, z: rect.z, w: r1(rect.w - wa), d: rect.d };
    wall = { x1: B.x, z1: rect.z, x2: B.x, z2: rect.z + rect.d, exterior: false, openings: [] };
  } else {
    const min = Math.min(2.6, rect.d / 3);
    const da = Math.min(Math.max(r1(rect.d * ratio), min), rect.d - min);
    A = { x: rect.x, z: rect.z, w: rect.w, d: da };
    B = { x: rect.x, z: rect.z + da, w: rect.w, d: r1(rect.d - da) };
    wall = { x1: rect.x, z1: B.z, x2: rect.x + rect.w, z2: B.z, exterior: false, openings: [] };
  }
  const la = partition(A, items.slice(0, k), ctx);
  const lb = partition(B, items.slice(k), ctx);
  wall.openings = [chooseDoor(wall, la, lb, vertical, ctx.rng)];
  ctx.walls.push(wall);
  return [...la, ...lb];
}

function chooseDoor(wall: WallSeg, la: RoomLayout[], lb: RoomLayout[], vertical: boolean, rng: () => number): Opening {
  const eps = 0.06;
  const cand: { lo: number; hi: number; a: RoomLayout; b: RoomLayout }[] = [];
  for (const a of la) {
    for (const b of lb) {
      const touches = vertical
        ? Math.abs(a.x + a.w - wall.x1) < eps && Math.abs(b.x - wall.x1) < eps
        : Math.abs(a.z + a.d - wall.z1) < eps && Math.abs(b.z - wall.z1) < eps;
      if (!touches) continue;
      const a0 = vertical ? a.z : a.x;
      const a1 = vertical ? a.z + a.d : a.x + a.w;
      const b0 = vertical ? b.z : b.x;
      const b1 = vertical ? b.z + b.d : b.x + b.w;
      const lo = Math.max(a0, b0);
      const hi = Math.min(a1, b1);
      if (hi - lo >= 1.3) cand.push({ lo, hi, a, b });
    }
  }
  if (!cand.length) {
    const len = vertical ? wall.z2 - wall.z1 : wall.x2 - wall.x1;
    const start = vertical ? wall.z1 : wall.x1;
    return { from: start + len / 2 - 0.5, to: start + len / 2 + 0.5, kind: "door", sill: 0, head: 2.2 };
  }
  const social = cand.filter((c) => SOCIAL.has(c.a.kind) && SOCIAL.has(c.b.kind) && c.hi - c.lo >= 2.8);
  if (social.length) {
    const c = social[Math.floor(rng() * social.length)];
    const mid = (c.lo + c.hi) / 2;
    const half = Math.min(1.7, (c.hi - c.lo) / 2 - 0.35);
    return { from: mid - half, to: mid + half, kind: "arch", sill: 0, head: 2.7 };
  }
  const c = cand[Math.floor(rng() * cand.length)];
  const span = c.hi - c.lo;
  const mid = (c.lo + c.hi) / 2 + (rng() - 0.5) * Math.max(0, span - 1.8) * 0.5;
  return { from: mid - 0.5, to: mid + 0.5, kind: "door", sill: 0, head: 2.2 };
}

function exteriorOpenings(
  room: RoomLayout,
  len: number,
  start: number,
  spec: ModelSpec,
  underground: boolean,
  styleGlass: boolean,
): Opening[] {
  if (underground || BLIND_ROOMS.has(room.kind)) return [];
  const out: Opening[] = [];
  const margin = 0.55;
  if (SMALL_WINDOW.has(room.kind)) {
    if (len >= 1.8) out.push({ from: start + len / 2 - 0.5, to: start + len / 2 + 0.5, kind: "window", sill: 1.5, head: 2.3 });
    return out;
  }
  if (GLASS_ROOMS.has(room.kind) && len >= 2.4) {
    if (styleGlass) {
      out.push({ from: start + margin, to: start + len - margin, kind: "slider", sill: 0, head: 99 });
    } else {
      const count = Math.max(1, Math.floor(len / 2.6));
      for (let k = 0; k < count; k++) {
        const c = start + ((k + 0.5) * len) / count;
        out.push({ from: c - 0.75, to: c + 0.75, kind: "window", sill: 0.05, head: 2.7 });
      }
    }
    return out;
  }
  const count = Math.max(1, Math.floor(len / 3.2));
  const narrow = spec.style === "minimal";
  const half = narrow ? 0.35 : 0.75;
  for (let k = 0; k < count; k++) {
    const c = start + ((k + 0.5) * len) / count;
    out.push({ from: c - half, to: c + half, kind: "window", sill: narrow ? 0.4 : 0.8, head: narrow ? 2.6 : 2.5 });
  }
  return out;
}

export function computeLayout(spec: ModelSpec): Layout {
  const rng = mulberry32(spec.seed);
  const n = spec.floors.length;
  const g = spec.groundIndex;
  const ys = new Array<number>(n).fill(0);
  for (let i = g + 1; i < n; i++) ys[i] = ys[i - 1] + spec.floors[i - 1].height;
  for (let i = g - 1; i >= 0; i--) ys[i] = ys[i + 1] - spec.floors[i].height;
  const styleGlass = spec.style === "modern" || spec.style === "tower" || spec.style === "island" || spec.style === "desert" || spec.style === "minimal";

  let totalArea = 0;
  let terraceArea = 0;
  const floors: FloorLayout[] = spec.floors.map((f, i) => {
    const sc = f.scale ?? [1, 1];
    const off = f.offset ?? [0, 0];
    const w = r1(spec.width * sc[0]);
    const d = r1(spec.depth * sc[1]);
    const rect: Rect = { x: r1(off[0] - w / 2), z: r1(off[1] - d / 2), w, d };
    const terrace = f.terrace ?? 0;
    const slab: Rect = { x: rect.x, z: rect.z, w, d: d + terrace };
    const walls: WallSeg[] = [];
    const ctx: Ctx = { floor: i, walls, rng };
    const rooms = partition(rect, f.rooms.map((r, idx) => ({ r, idx })), ctx);
    const underground = i < g;

    // exterior walls
    const eps = 0.06;
    const garageDone = { v: false };
    const sorted = [...rooms];
    for (const room of sorted) {
      const all: { side: "n" | "s" | "e" | "w"; ok: boolean }[] = [
        { side: "s", ok: Math.abs(room.z + room.d - (rect.z + rect.d)) < eps },
        { side: "e", ok: Math.abs(room.x + room.w - (rect.x + rect.w)) < eps },
        { side: "w", ok: Math.abs(room.x - rect.x) < eps },
        { side: "n", ok: Math.abs(room.z - rect.z) < eps },
      ];
      // garages face the drive, never the pool terrace
      const sides = room.kind === "garage" ? [all[1], all[2], all[3], all[0]] : all;
      for (const s of sides) {
        if (!s.ok) continue;
        let seg: WallSeg;
        let len: number;
        let start: number;
        if (s.side === "n" || s.side === "s") {
          const z = s.side === "n" ? rect.z : rect.z + rect.d;
          seg = { x1: room.x, z1: z, x2: room.x + room.w, z2: z, exterior: true, openings: [], side: s.side };
          len = room.w;
          start = room.x;
        } else {
          const x = s.side === "w" ? rect.x : rect.x + rect.w;
          seg = { x1: x, z1: room.z, x2: x, z2: room.z + room.d, exterior: true, openings: [], side: s.side };
          len = room.d;
          start = room.z;
        }
        if (room.kind === "garage") {
          if (!garageDone.v && !underground) {
            seg.openings = [{ from: start + 0.6, to: start + len - 0.6, kind: "garage", sill: 0, head: 2.6 }];
            garageDone.v = true;
          } else if (underground && !garageDone.v && s.side === "s") {
            garageDone.v = true;
          }
        } else if (room.kind === "entry" && s.side === "s" && i === g) {
          seg.openings = [{ from: start + len / 2 - 0.85, to: start + len / 2 + 0.85, kind: "main", sill: 0, head: 2.7 }];
        } else {
          seg.openings = exteriorOpenings(room, len, start, spec, underground, styleGlass);
        }
        walls.push(seg);
      }
    }
    // guarantee a main entrance on the ground floor
    if (i === g && !walls.some((w) => w.openings.some((o) => o.kind === "main"))) {
      const south = walls
        .filter((w) => w.side === "s" && !w.openings.some((o) => o.kind === "garage"))
        .sort((a, b) => b.x2 - b.x1 - (a.x2 - a.x1));
      const target = south[0] ?? walls.find((w) => w.exterior && !w.openings.some((o) => o.kind === "garage"));
      if (target) {
        const vertical = target.x1 === target.x2;
        const start = vertical ? target.z1 : target.x1;
        const len = vertical ? target.z2 - target.z1 : target.x2 - target.x1;
        target.openings = [{ from: start + len / 2 - 0.85, to: start + len / 2 + 0.85, kind: "main", sill: 0, head: 2.7 }];
      }
    }

    const area = Math.round(w * d);
    totalArea += area;
    terraceArea += Math.round(w * terrace);
    const terraceRoom: RoomLayout | null =
      terrace >= 2.5
        ? {
            id: `f${i}-terrace`,
            floor: i,
            kind: "terrace",
            name: spec.pool && (spec.pool.floor ?? g) === i ? "Pool Terrace" : i === g ? "Garden Terrace" : "Terrace",
            x: rect.x,
            z: rect.z + rect.d,
            w,
            d: terrace,
            area: Math.round(w * terrace * 10) / 10,
          }
        : null;
    return { index: i, name: f.name, height: f.height, y: ys[i], rect, slab, terrace, rooms, terraceRoom, walls, area };
  });

  let pool: Layout["pool"] = null;
  if (spec.pool) {
    const pf = spec.pool.floor ?? g;
    const fl = floors[pf];
    if (fl && fl.terrace >= spec.pool.d + 1.5) {
      const cx = fl.rect.x + fl.rect.w / 2 + (spec.pool.dx ?? 0);
      const zEnd = fl.slab.z + fl.slab.d - 1.0;
      pool = { x: cx - spec.pool.w / 2, z: zEnd - spec.pool.d, w: spec.pool.w, d: spec.pool.d, floor: pf };
    }
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const f of floors) {
    minX = Math.min(minX, f.slab.x);
    maxX = Math.max(maxX, f.slab.x + f.slab.w);
    minZ = Math.min(minZ, f.slab.z);
    maxZ = Math.max(maxZ, f.slab.z + f.slab.d);
  }
  const top = floors[n - 1];
  return {
    floors,
    groundIndex: g,
    elevation: spec.elevation ?? 0,
    totalArea,
    terraceArea,
    pool,
    extents: {
      minX,
      maxX,
      minZ,
      maxZ,
      minY: floors[0].y - SLAB,
      maxY: top.y + top.height + 2,
    },
  };
}

export const SQM_TO_SQFT = 10.7639;

export function countRooms(layout: Layout) {
  let beds = 0;
  let baths = 0;
  for (const f of layout.floors) {
    for (const r of f.rooms) {
      if (r.kind === "master" || r.kind === "bedroom" || r.kind === "kids") beds++;
      if (r.kind === "bath") baths++;
      if (r.kind === "master") baths++; // ensuite
    }
  }
  return { beds, baths };
}

export function levelLabel(spec: ModelSpec, i: number) {
  return spec.floors[i]?.name ?? `Level ${i}`;
}
