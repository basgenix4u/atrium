import * as THREE from "three";
import type { Rect, RoomLayout } from "../layout";
import type { Mats } from "./materials";

export interface FurnObject {
  group: THREE.Group;
  name: string;
  desc: string;
}

export interface FurnResult {
  group: THREE.Group;
  objects: FurnObject[];
}

export function box(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = w * h * d > 0.25;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function cyl(
  parent: THREE.Object3D,
  rt: number,
  rb: number,
  h: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  seg = 20,
) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = h * rb > 0.3;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function sph(parent: THREE.Object3D, r: number, mat: THREE.Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = false;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function bed(parent: THREE.Object3D, m: Mats, w: number, l: number, x: number, z: number, headNorth = true) {
  const s = headNorth ? 1 : -1;
  box(parent, w, 0.38, l, m.woodDark, x, 0.19, z);
  box(parent, w - 0.12, 0.26, l - 0.15, m.fabric, x, 0.5, z + 0.03 * s);
  box(parent, w + 0.3, 1.15, 0.14, m.wood, x, 0.58, z - s * (l / 2 + 0.02));
  box(parent, w * 0.34, 0.14, 0.42, m.fabric, x - w * 0.22, 0.7, z - s * (l / 2 - 0.4));
  box(parent, w * 0.34, 0.14, 0.42, m.fabric, x + w * 0.22, 0.7, z - s * (l / 2 - 0.4));
  box(parent, w - 0.1, 0.05, l * 0.38, m.fabricDark, x, 0.64, z + s * l * 0.28);
}

function sofa(parent: THREE.Object3D, m: Mats, len: number, x: number, z: number, rotY = 0, mat?: THREE.Material) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  const f = mat ?? m.fabric;
  box(g, len, 0.42, 1.0, f, 0, 0.22, 0);
  box(g, len, 0.5, 0.24, f, 0, 0.62, 0.42);
  box(g, 0.22, 0.28, 1.0, f, -len / 2 + 0.11, 0.56, 0);
  box(g, 0.22, 0.28, 1.0, f, len / 2 - 0.11, 0.56, 0);
  parent.add(g);
  return g;
}

function floorLamp(parent: THREE.Object3D, m: Mats, x: number, z: number, h = 1.6) {
  cyl(parent, 0.02, 0.02, h, m.brass, x, h / 2, z, 8);
  cyl(parent, 0.18, 0.12, 0.3, m.lamp, x, h + 0.05, z, 12);
  cyl(parent, 0.13, 0.13, 0.03, m.brass, x, 0.015, z, 12);
}

export function furnishRoom(room: RoomLayout, ceil: number, m: Mats): FurnResult {
  const g = new THREE.Group();
  const objects: FurnObject[] = [];
  const W = room.w;
  const D = room.d;
  const hw = W / 2;
  const hd = D / 2;
  const reg = (grp: THREE.Group, name: string, desc: string) => {
    g.add(grp);
    objects.push({ group: grp, name, desc });
    return grp;
  };

  switch (room.kind) {
    case "living": {
      const sl = Math.min(3.6, W * 0.5);
      box(g, W * 0.56, 0.02, D * 0.5, m.rug, 0, 0.012, D * 0.06);
      sofa(g, m, sl, 0, D * 0.2, Math.PI);
      sofa(g, m, Math.min(2.6, W * 0.3), -sl / 2 - 1.1, -D * 0.04, Math.PI / 2, m.fabricDark);
      box(g, 1.5, 0.36, 0.85, m.marble, 0, 0.18, -D * 0.04);
      floorLamp(g, m, hw - 0.7, -hd + 0.8);
      floorLamp(g, m, -hw + 0.7, hd - 0.8);
      const fp = new THREE.Group();
      const fh = Math.min(ceil - 0.4, 3.0);
      const fw = Math.min(3.4, W * 0.45);
      box(fp, fw, fh, 0.55, m.stone, 0, fh / 2, -hd + 0.3);
      box(fp, fw * 0.55, 0.55, 0.12, m.fire, 0, 0.6, -hd + 0.62);
      reg(fp, "Sculptural fireplace", "A floor-to-ceiling honed-stone surround with a concealed bio-ethanol flame — the heart of the principal salon.");
      break;
    }
    case "kitchen": {
      box(g, W - 0.8, 0.9, 0.65, m.wood, 0, 0.45, -hd + 0.45);
      box(g, W - 0.8, 0.04, 0.68, m.marble, 0, 0.92, -hd + 0.45);
      if (D > 3.4) box(g, W - 0.8, 0.85, 0.36, m.woodDark, 0, 2.05, -hd + 0.28);
      box(g, 0.9, 2.1, 0.7, m.metal, hw - 0.85, 1.05, -hd + 0.5);
      const isl = new THREE.Group();
      const il = Math.min(3.8, W - 1.8);
      box(isl, il, 0.92, 1.1, m.marble, 0, 0.46, D * 0.1);
      for (let k = 0; k < 3; k++) cyl(isl, 0.2, 0.18, 0.7, m.fabricDark, -il / 3 + (k * il) / 3 + il / 6, 0.35, D * 0.1 + 0.9);
      reg(isl, "Marble chef's island", "A single 3.8 m slab of book-matched Calacatta with integrated induction, steam and a concealed prep kitchen behind.");
      break;
    }
    case "dining": {
      const tl = Math.min(4.8, W - 1.8);
      const tw = Math.min(1.3, D - 1.6);
      const t = new THREE.Group();
      box(t, tl, 0.06, tw, m.wood, 0, 0.76, 0);
      box(t, tl - 0.7, 0.72, 0.14, m.woodDark, 0, 0.36, 0);
      const n = Math.max(2, Math.floor(tl / 0.85));
      for (let i = 0; i < n; i++) {
        const x = -tl / 2 + ((i + 0.5) * tl) / n;
        for (const s of [-1, 1]) {
          box(t, 0.46, 0.48, 0.46, m.fabricDark, x, 0.25, s * (tw / 2 + 0.38));
          box(t, 0.46, 0.55, 0.06, m.fabricDark, x, 0.74, s * (tw / 2 + 0.38 + 0.2));
        }
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.025, 8, 36), m.lamp);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, ceil - 1.3, 0);
      t.add(ring);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        sph(t, 0.07, m.lamp, Math.cos(a) * 0.6, ceil - 1.3, Math.sin(a) * 0.6);
      }
      cyl(t, 0.01, 0.01, 1.2, m.brass, 0, ceil - 0.7, 0, 6);
      reg(t, "Dining table", "Hand-finished oak table seating twelve beneath a bespoke brass-and-glass chandelier.");
      break;
    }
    case "master": {
      box(g, W * 0.5, 0.02, D * 0.5, m.rug, 0, 0.012, 0.3);
      const b = new THREE.Group();
      bed(b, m, 2.2, 2.3, 0, -hd + 1.45);
      box(b, 0.5, 0.5, 0.45, m.wood, -1.55, 0.25, -hd + 0.5);
      box(b, 0.5, 0.5, 0.45, m.wood, 1.55, 0.25, -hd + 0.5);
      box(b, 1.9, 0.4, 0.5, m.fabricDark, 0, 0.2, -hd + 3.0);
      reg(b, "Primary bed", "A bespoke emperor bed in hand-stitched linen, framed by a floating oak headboard and integrated reading light.");
      box(g, 0.6, Math.min(ceil - 0.5, 2.7), Math.min(D - 1.5, 4.2), m.wood, hw - 0.4, Math.min(ceil - 0.5, 2.7) / 2, 0.2);
      sofa(g, m, 1.8, -hw + 1.3, hd - 1.2, Math.PI / 2, m.fabricDark);
      floorLamp(g, m, -hw + 0.6, -hd + 0.7);
      break;
    }
    case "bedroom":
    case "kids": {
      const small = room.kind === "kids";
      box(g, W * 0.45, 0.02, D * 0.45, m.rug, 0, 0.012, 0.2);
      const b = new THREE.Group();
      bed(b, m, small ? 1.2 : 1.8, small ? 2.0 : 2.1, 0, -hd + (small ? 1.25 : 1.35));
      if (!small) {
        box(b, 0.45, 0.45, 0.4, m.wood, -1.3, 0.22, -hd + 0.45);
        box(b, 0.45, 0.45, 0.4, m.wood, 1.3, 0.22, -hd + 0.45);
      }
      reg(b, small ? "Bunk bed" : "Guest bed", small ? "Custom-built oak bunks with integrated lighting and storage." : "A linen-dressed guest bed with floating nightstands and concealed lighting.");
      box(g, 1.4, 0.04, 0.6, m.wood, hw - 1.0, 0.74, hd - 0.5);
      box(g, 0.06, 0.74, 0.5, m.dark, hw - 0.4, 0.37, hd - 0.5);
      box(g, 0.06, 0.74, 0.5, m.dark, hw - 1.6, 0.37, hd - 0.5);
      if (small) {
        const cols = [m.art[0], m.art[1], m.art[2]];
        for (let k = 0; k < 4; k++) box(g, 0.45, 0.45, 0.45, cols[k % 3], -hw + 0.8 + k * 0.5, 0.23, hd - 0.7);
      }
      break;
    }
    case "staff": {
      box(g, 1.1, 0.4, 2.0, m.woodDark, -hw + 0.9, 0.2, -hd + 1.2);
      box(g, 1.0, 0.2, 1.9, m.fabric, -hw + 0.9, 0.5, -hd + 1.2);
      box(g, 1.2, 0.04, 0.6, m.wood, hw - 0.9, 0.74, hd - 0.6);
      break;
    }
    case "bath": {
      box(g, Math.min(W - 0.8, 1.8), 0.85, 0.55, m.marble, 0, 0.43, -hd + 0.4);
      box(g, Math.min(W - 1.2, 1.5), 1.1, 0.03, m.mirror, 0, 1.55, -hd + 0.1);
      if (W > 3.3 && D > 2.8) {
        const t = new THREE.Group();
        const tub = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 8, 20), m.marble);
        tub.rotation.z = Math.PI / 2;
        tub.scale.set(1, 1, 0.9);
        tub.position.set(0, 0.42, 0);
        tub.castShadow = true;
        t.add(tub);
        const wtr = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.05, 8, 20), m.water);
        wtr.rotation.z = Math.PI / 2;
        wtr.scale.set(1, 0.35, 0.85);
        wtr.position.set(0, 0.62, 0);
        t.add(wtr);
        t.position.set(-W * 0.12, 0, D * 0.12);
        reg(t, "Sculpted stone tub", "A freestanding bath carved from a single block of honed limestone, with floor-mounted brass fittings.");
      }
      box(g, 1.0, 2.2, 1.0, m.glass, hw - 0.65, 1.1, hd - 0.65);
      break;
    }
    case "entry": {
      box(g, 1.6, 0.8, 0.4, m.wood, 0, 0.4, -hd + 0.35);
      box(g, 1.2, 0.02, Math.max(2, D - 1.0), m.rug, 0, 0.012, 0);
      const s = new THREE.Group();
      box(s, 0.6, 0.9, 0.6, m.marble, 0, 0.45, 0);
      const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.3, 0.085, 110, 14), m.brass);
      knot.position.set(0, 1.4, 0);
      knot.castShadow = true;
      s.add(knot);
      s.position.set(Math.min(W * 0.25, 1.6), 0, -D * 0.1);
      reg(s, "Entrance sculpture", "A commissioned patinated-brass torus knot on a travertine plinth, lit to greet every arrival.");
      sph(g, 0.2, m.lamp, 0, ceil - 1.0, 0);
      sph(g, 0.2, m.lamp, 0, ceil - 1.0, D * 0.25);
      break;
    }
    case "library": {
      const sh = Math.min(ceil - 0.5, 3.2);
      box(g, W - 0.6, sh, 0.4, m.woodDark, 0, sh / 2, -hd + 0.3);
      const lib = new THREE.Group();
      const rows = Math.floor(sh / 0.5);
      for (let r = 0; r < rows; r++) box(lib, W - 0.9, 0.3, 0.06, m.books[r % 4], 0, 0.4 + r * 0.5, -hd + 0.52);
      reg(lib, "Library wall", "Floor-to-ceiling walnut shelving with a rolling brass ladder, curated for four thousand volumes.");
      box(g, W * 0.5, 0.02, D * 0.45, m.rug, 0, 0.012, D * 0.1);
      sofa(g, m, 1.1, 0, D * 0.12, Math.PI, m.fabricDark);
      floorLamp(g, m, 1.1, D * 0.2);
      break;
    }
    case "cinema": {
      const cin = new THREE.Group();
      const sw = Math.min(W - 1.2, 5.2);
      box(cin, sw, 2.3, 0.1, m.screen, 0, 1.55, -hd + 0.15);
      const seats = Math.max(2, Math.floor((W - 1.6) / 1.15));
      for (let row = 0; row < 2; row++) {
        const z = D * 0.06 + row * 1.5;
        const lift = row * 0.28;
        if (row === 1) box(cin, W - 1.2, 0.28, 1.4, m.fabricDark, 0, 0.14, z);
        for (let i = 0; i < seats; i++) {
          const x = -((seats - 1) * 1.1) / 2 + i * 1.1;
          box(cin, 0.95, 0.5, 0.95, m.fabricDark, x, 0.28 + lift, z);
          box(cin, 0.95, 0.85, 0.22, m.fabricDark, x, 0.7 + lift, z + 0.45);
        }
      }
      reg(cin, "Private cinema", "4K laser projection, acoustically isolated walls and fully-reclining leather seating for eight.");
      break;
    }
    case "spa": {
      const sp = new THREE.Group();
      const pw = Math.min(W - 1.4, 4.2);
      const pd = Math.min(D - 1.8, 3.0);
      box(sp, pw, 0.45, pd, m.marble, 0, 0.225, 0.1);
      const wt = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.5, pd - 0.5), m.water);
      wt.rotation.x = -Math.PI / 2;
      wt.position.set(0, 0.47, 0.1);
      sp.add(wt);
      reg(sp, "Thermal plunge pool", "A heated mosaic-lined plunge pool, with contrast cold-plunge and underwater chromatherapy.");
      box(g, 1.9, 2.3, 1.9, m.wood, hw - 1.05, 1.15, -hd + 1.05);
      box(g, 0.7, 0.35, 1.9, m.fabric, -hw + 0.7, 0.18, hd - 1.2);
      break;
    }
    case "gym": {
      const gy = new THREE.Group();
      box(gy, W - 0.6, 2.3, 0.05, m.mirror, 0, 1.15, -hd + 0.1);
      box(gy, 0.9, 0.18, 1.9, m.dark, -W * 0.18, 0.12, D * 0.05);
      box(gy, 0.06, 1.1, 0.06, m.metal, -W * 0.18 - 0.35, 0.7, D * 0.05 - 0.8);
      box(gy, 0.06, 1.1, 0.06, m.metal, -W * 0.18 + 0.35, 0.7, D * 0.05 - 0.8);
      box(gy, 2.4, 2.2, 0.12, m.dark, hw - 1.5, 1.1, hd - 0.2);
      box(gy, 1.8, 0.04, 0.5, m.metal, hw - 1.5, 1.2, hd - 0.7);
      box(gy, 2.2, 0.03, 2.0, m.fabricDark, W * 0.1, 0.02, D * 0.12);
      reg(gy, "Training studio", "Mirrored wall, performance flooring and a full commercial-grade equipment suite.");
      break;
    }
    case "wine": {
      const wn = new THREE.Group();
      const sh = Math.min(ceil - 0.5, 2.6);
      box(wn, W - 0.4, sh, 0.45, m.woodDark, 0, sh / 2, -hd + 0.28);
      const cols = Math.max(4, Math.floor((W - 0.9) / 0.2));
      const rows = Math.floor(sh / 0.34);
      const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.042, 0.042, 0.34, 8), m.bottle, cols * rows);
      const mtx = new THREE.Matrix4();
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
      let c = 0;
      for (let r = 0; r < rows; r++) {
        for (let i = 0; i < cols; i++) {
          mtx.compose(new THREE.Vector3(-((cols - 1) * 0.2) / 2 + i * 0.2, 0.25 + r * 0.33, -hd + 0.52), q, new THREE.Vector3(1, 1, 1));
          inst.setMatrixAt(c++, mtx);
        }
      }
      wn.add(inst);
      cyl(wn, 0.7, 0.7, 0.05, m.wood, 0, 0.95, D * 0.1, 24);
      cyl(wn, 0.08, 0.08, 0.95, m.metal, 0, 0.47, D * 0.1, 10);
      reg(wn, "Wine wall", "A climate-controlled glass-fronted cellar holding 1,200 bottles at a constant 12.5 °C.");
      break;
    }
    case "garage": {
      const gr = new THREE.Group();
      const alongZ = D >= 5.2;
      const span = alongZ ? W : D;
      const n = Math.max(1, Math.min(4, Math.floor((span - 0.6) / 2.5)));
      for (let i = 0; i < n; i++) {
        const car = new THREE.Group();
        const paint = m.cars[i % m.cars.length];
        box(car, 1.9, 0.5, 4.5, paint, 0, 0.55, 0);
        box(car, 1.65, 0.46, 2.2, m.glass, 0, 1.0, -0.2);
        box(car, 1.5, 0.05, 2.0, paint, 0, 1.25, -0.2);
        for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]] as const) {
          const w = cyl(car, 0.36, 0.36, 0.26, m.dark, wx, 0.36, wz, 18);
          w.rotation.z = Math.PI / 2;
        }
        const pos = -((n - 1) * 2.5) / 2 + i * 2.5;
        car.position.set(alongZ ? pos : 0, 0, alongZ ? 0 : pos);
        if (!alongZ) car.rotation.y = Math.PI / 2;
        gr.add(car);
      }
      reg(gr, "Collector's cars", "Climate-controlled, floor-sealed bays with turntable, battery-conditioning and a display wall.");
      break;
    }
    case "office": {
      const of = new THREE.Group();
      box(of, 2.0, 0.05, 0.9, m.wood, 0, 0.75, -hd + 1.3);
      box(of, 0.06, 0.72, 0.8, m.dark, -0.9, 0.36, -hd + 1.3);
      box(of, 0.06, 0.72, 0.8, m.dark, 0.9, 0.36, -hd + 1.3);
      box(of, 0.9, 0.5, 0.04, m.screen, 0, 1.1, -hd + 1.55);
      box(of, 0.6, 0.55, 0.6, m.fabricDark, 0, 0.3, -hd + 0.5);
      reg(of, "Executive desk", "A monolithic walnut desk with concealed power and a secure, soundproofed alcove.");
      box(g, 0.4, 2.4, W - 1, m.woodDark, -hw + 0.3, 1.2, 0);
      break;
    }
    case "lounge": {
      box(g, W * 0.5, 0.02, D * 0.4, m.rug, 0, 0.012, D * 0.15);
      sofa(g, m, Math.min(3.0, W * 0.4), -W * 0.12, D * 0.25, Math.PI, m.fabricDark);
      cyl(g, 0.55, 0.5, 0.4, m.marble, -W * 0.12, 0.2, D * 0.0, 24);
      const bar = new THREE.Group();
      const bl = Math.min(3.4, W - 1.6);
      box(bar, bl, 1.05, 0.7, m.woodDark, 0, 0.52, -hd + 0.9);
      box(bar, bl + 0.1, 0.05, 0.8, m.marble, 0, 1.07, -hd + 0.9);
      box(bar, bl, 0.05, 0.3, m.lamp, 0, 1.6, -hd + 0.25);
      for (let k = 0; k < 3; k++) cyl(bar, 0.19, 0.17, 0.75, m.fabricDark, -bl / 3 + k * (bl / 3) + bl / 6, 0.4, -hd + 1.55);
      reg(bar, "Cocktail bar", "Back-lit onyx shelving and a book-matched marble counter, with a dedicated mixology station.");
      break;
    }
    case "gallery": {
      const gl = new THREE.Group();
      const n = Math.max(2, Math.min(4, Math.floor((W - 1) / 1.8)));
      for (let i = 0; i < n; i++) {
        const x = -((n - 1) * 1.7) / 2 + i * 1.7;
        box(gl, 1.2, 1.6, 0.05, m.art[i % m.art.length], x, 1.7, -hd + 0.1);
        box(gl, 1.3, 1.7, 0.03, m.brass, x, 1.7, -hd + 0.07);
      }
      const ped = new THREE.Group();
      box(ped, 0.5, 1.1, 0.5, m.marble, 0, 0.55, 0);
      const orb = new THREE.Mesh(new THREE.TorusKnotGeometry(0.2, 0.06, 80, 10), m.metal);
      orb.position.set(0, 1.45, 0);
      ped.add(orb);
      ped.position.set(-hw + 1.0, 0, D * 0.15);
      gl.add(ped);
      box(g, 1.8, 0.4, 0.6, m.fabricDark, 0, 0.2, D * 0.1);
      reg(gl, "Art wall", "Museum-grade picture lighting and humidity control for a rotating private collection.");
      break;
    }
    case "pool": {
      const pl = new THREE.Group();
      const pw = W - 2.4;
      const pd = D - 2.4;
      box(pl, pw + 0.5, 0.25, pd + 0.5, m.marble, 0, 0.125, 0);
      const wt = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), m.water);
      wt.rotation.x = -Math.PI / 2;
      wt.position.set(0, 0.26, 0);
      pl.add(wt);
      reg(pl, "Indoor lap pool", "A 14 m heated lap pool with counter-current swimming and a retractable cover.");
      box(g, 0.7, 0.35, 1.9, m.fabric, -hw + 0.7, 0.18, hd - 1.2);
      break;
    }
    default:
      break;
  }
  return { group: g, objects };
}

/** Furnishes the open terrace of a floor. Pool coordinates are absolute. */
export function furnishTerrace(room: RoomLayout, pool: Rect | null, m: Mats): FurnResult {
  const g = new THREE.Group();
  const objects: FurnObject[] = [];
  const cx = room.x + room.w / 2;
  const cz = room.z + room.d / 2;
  if (pool) {
    const pg = new THREE.Group();
    pg.position.set(pool.x + pool.w / 2 - cx, 0, pool.z + pool.d / 2 - cz);
    const t = 0.34;
    const hgt = 0.26;
    box(pg, pool.w + 2 * t, hgt, t, m.marble, 0, hgt / 2, -(pool.d / 2 + t / 2));
    box(pg, pool.w + 2 * t, hgt, t, m.marble, 0, hgt / 2, pool.d / 2 + t / 2);
    box(pg, t, hgt, pool.d, m.marble, -(pool.w / 2 + t / 2), hgt / 2, 0);
    box(pg, t, hgt, pool.d, m.marble, pool.w / 2 + t / 2, hgt / 2, 0);
    box(pg, pool.w, 0.12, pool.d, m.stone, 0, 0.06, 0);
    const wt = new THREE.Mesh(new THREE.PlaneGeometry(pool.w, pool.d), m.water);
    wt.rotation.x = -Math.PI / 2;
    wt.position.set(0, hgt - 0.06, 0);
    wt.receiveShadow = true;
    pg.add(wt);
    g.add(pg);
    objects.push({ group: pg, name: "Infinity pool", desc: "A heated, salt-chlorinated infinity-edge pool with underwater lighting, set into the terrace." });
  }
  // loungers
  const gz = pool ? (room.z + pool.z) / 2 - cz : 0;
  const n = Math.max(2, Math.min(4, Math.floor(room.w / 6)));
  const lg = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const x = (pool ? pool.x + pool.w / 2 - cx : 0) + (i - (n - 1) / 2) * 2.7;
    const lz = pool ? gz : room.d * 0.1;
    box(lg, 2.0, 0.28, 0.75, m.fabric, x, 0.22, lz);
    const back = box(lg, 0.8, 0.1, 0.75, m.fabric, x - 0.95, 0.5, lz);
    back.rotation.z = -0.6;
    box(lg, 0.04, 0.28, 0.6, m.dark, x - 0.8, 0.14, lz);
    box(lg, 0.04, 0.28, 0.6, m.dark, x + 0.8, 0.14, lz);
    box(lg, 0.45, 0.4, 0.45, m.marble, x + 1.55, 0.2, lz);
  }
  g.add(lg);
  objects.push({ group: lg, name: "Terrace loungers", desc: "Weather-proof teak and linen sun loungers with side tables, oriented to the view." });
  if (!pool) {
    const dn = new THREE.Group();
    cyl(dn, 0.8, 0.8, 0.06, m.wood, 0, 0.74, -room.d * 0.1, 24);
    cyl(dn, 0.06, 0.06, 0.72, m.metal, 0, 0.37, -room.d * 0.1, 8);
    g.add(dn);
  }
  // planters
  for (const sx of [-1, 1]) {
    cyl(g, 0.4, 0.32, 0.6, m.stone, sx * (room.w / 2 - 0.6), 0.3, room.d / 2 - 0.5, 14);
    sph(g, 0.5, m.leaf, sx * (room.w / 2 - 0.6), 0.95, room.d / 2 - 0.5, 1, 1.2, 1);
  }
  return { group: g, objects };
}
