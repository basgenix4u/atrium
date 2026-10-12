import * as THREE from "three";
import type { Layout } from "../layout";
import { SLAB } from "../layout";
import type { ModelSpec } from "../types";
import { makeWindowTextures, shade, type Mats } from "./materials";

export interface Env {
  group: THREE.Group;
  fade: THREE.MeshStandardMaterial[];
  update: (dt: number, glow: number) => void;
  fogFar: number;
}

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

function scaleBoxUV(geo: THREE.BoxGeometry, w: number, h: number, d: number, tileU = 25, tileV = 29) {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const faces: [number, number][] = [
    [d / tileU, h / tileV],
    [d / tileU, h / tileV],
    [w / tileU, d / tileU],
    [w / tileU, d / tileU],
    [w / tileU, h / tileV],
    [w / tileU, h / tileV],
  ];
  for (let i = 0; i < uv.count; i++) {
    const f = faces[Math.floor(i / 4)];
    uv.setXY(i, uv.getX(i) * f[0], uv.getY(i) * f[1]);
  }
  uv.needsUpdate = true;
}

export function buildEnvironment(spec: ModelSpec, layout: Layout, m: Mats): Env {
  const group = new THREE.Group();
  const fade: THREE.MeshStandardMaterial[] = [];
  const updaters: ((dt: number, glow: number) => void)[] = [];
  const rng = mulberry32(spec.seed * 7 + 3);
  const ex = layout.extents;
  const cx = (ex.minX + ex.maxX) / 2;
  const cz = (ex.minZ + ex.maxZ) / 2;
  const elev = layout.elevation;
  let fogFar = 2600;

  const gmat = (color: string, rough = 1) => {
    const mt = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, transparent: true });
    fade.push(mt);
    return mt;
  };
  const smat = (color: string, rough = 0.9, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

  const inFootprint = (x: number, z: number, pad: number) => x > ex.minX - pad && x < ex.maxX + pad && z > ex.minZ - pad && z < ex.maxZ + pad;

  // ---- vegetation -------------------------------------------------------
  const leafGeo = new THREE.ConeGeometry(0.35, 4.2, 4).translate(0, 2.1, 0);
  const coneGeo = new THREE.ConeGeometry(1, 1, 9);
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.24, 1, 7);
  const roundGeo = new THREE.IcosahedronGeometry(1, 1);
  const cypressGeo = new THREE.CylinderGeometry(0.05, 0.9, 1, 8);

  const palm = (x: number, y: number, z: number, s = 1) => {
    const t = new THREE.Group();
    t.position.set(x, y, z);
    const h = (6.5 + rng() * 3) * s;
    const trunk = new THREE.Mesh(trunkGeo, m.trunk);
    trunk.scale.set(s, h, s);
    trunk.position.y = h / 2;
    trunk.rotation.z = (rng() - 0.5) * 0.14;
    t.add(trunk);
    const crown = new THREE.Group();
    crown.position.y = h;
    for (let k = 0; k < 9; k++) {
      const pivot = new THREE.Group();
      pivot.rotation.y = (k / 9) * Math.PI * 2 + rng() * 0.3;
      const leaf = new THREE.Mesh(leafGeo, m.leaf);
      leaf.scale.set(s, s, s * 0.3);
      leaf.rotation.z = -(1.0 + rng() * 0.35);
      pivot.add(leaf);
      crown.add(pivot);
    }
    t.add(crown);
    group.add(t);
  };

  const pine = (x: number, y: number, z: number, s = 1, snowy = false) => {
    const t = new THREE.Group();
    t.position.set(x, y, z);
    const h = (9 + rng() * 5) * s;
    const trunk = new THREE.Mesh(trunkGeo, m.trunk);
    trunk.scale.set(s * 1.4, h * 0.3, s * 1.4);
    trunk.position.y = h * 0.15;
    t.add(trunk);
    for (let k = 0; k < 4; k++) {
      const r = (2.7 - k * 0.55) * s;
      const th = 3.3 * s;
      const yy = h * 0.18 + k * 2.1 * s;
      const c = new THREE.Mesh(coneGeo, m.leafDark);
      c.scale.set(r, th, r);
      c.position.y = yy + th / 2;
      t.add(c);
      if (snowy) {
        const sc = new THREE.Mesh(coneGeo, m.snow);
        sc.scale.set(r * 0.88, th * 0.62, r * 0.88);
        sc.position.y = yy + th * 0.69;
        t.add(sc);
      }
    }
    group.add(t);
  };

  const cypress = (x: number, y: number, z: number, s = 1) => {
    const h = (8 + rng() * 5) * s;
    const c = new THREE.Mesh(cypressGeo, m.leafDark);
    c.scale.set(s, h, s);
    c.position.set(x, y + h / 2 + 0.3, z);
    group.add(c);
  };

  const roundTree = (x: number, y: number, z: number, s = 1) => {
    const t = new THREE.Group();
    t.position.set(x, y, z);
    const th = 2.4 * s;
    const trunk = new THREE.Mesh(trunkGeo, m.trunk);
    trunk.scale.set(s * 0.9, th, s * 0.9);
    trunk.position.y = th / 2;
    t.add(trunk);
    const crown = new THREE.Mesh(roundGeo, rng() > 0.5 ? m.leaf : m.leafDark);
    crown.scale.set(2.3 * s, 2.0 * s, 2.3 * s);
    crown.position.y = th + 1.3 * s;
    t.add(crown);
    group.add(t);
  };

  const cactus = (x: number, y: number, z: number, s = 1) => {
    const t = new THREE.Group();
    t.position.set(x, y, z);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.26 * s, 2.6 * s, 8), m.leaf);
    body.position.y = 1.3 * s;
    t.add(body);
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.14 * s, 1.0 * s, 8), m.leaf);
      arm.position.set(sx * 0.5 * s, 1.5 * s + (sx > 0 ? 0.3 : 0), 0);
      t.add(arm);
      const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.12 * s, 0.5 * s, 8), m.leaf);
      elbow.rotation.z = Math.PI / 2;
      elbow.position.set(sx * 0.27 * s, 1.1 * s + (sx > 0 ? 0.3 : 0), 0);
      t.add(elbow);
    }
    group.add(t);
  };

  const bush = (x: number, y: number, z: number, s = 1) => {
    const b = new THREE.Mesh(roundGeo, m.leaf);
    b.scale.set(0.9 * s, 0.65 * s, 0.9 * s);
    b.position.set(x, y + 0.5 * s, z);
    group.add(b);
  };

  const scatter = (count: number, rMin: number, rMax: number, ok: (x: number, z: number) => boolean, make: (x: number, z: number) => void) => {
    let placed = 0;
    for (let tries = 0; tries < count * 14 && placed < count; tries++) {
      const a = rng() * Math.PI * 2;
      const r = rMin + rng() * (rMax - rMin);
      const x = cx + Math.cos(a) * r * 1.25;
      const z = cz + Math.sin(a) * r;
      if (inFootprint(x, z, 5) || !ok(x, z)) continue;
      make(x, z);
      placed++;
    }
  };

  const mountains = (count: number, rMin: number, rMax: number, hMin: number, hMax: number, color: string, snowCaps: boolean, a0 = 0, a1 = Math.PI * 2, baseY = -3) => {
    const mt = smat(color, 1);
    mt.flatShading = true;
    const cap = smat("#f2f5f9", 1);
    cap.flatShading = true;
    for (let i = 0; i < count; i++) {
      const a = a0 + ((i + rng() * 0.8) / count) * (a1 - a0);
      const r = rMin + rng() * (rMax - rMin);
      const h = hMin + rng() * (hMax - hMin);
      const rad = h * (snowCaps ? 1.25 : 2.3) * (0.9 + rng() * 0.5);
      const geo = new THREE.ConeGeometry(rad, h, 12, 3);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const ph = [rng() * 6, rng() * 6, rng() * 6];
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v);
        const z = pos.getZ(v);
        const y = pos.getY(v);
        const ang = Math.atan2(z, x);
        const wob = 1 + 0.2 * Math.sin(ang * 3 + ph[0]) + 0.1 * Math.sin(ang * 7 + ph[1]);
        const lift = ((y + h / 2) / h) * 0.07 * h * Math.sin(ang * 5 + ph[2]);
        pos.setXYZ(v, x * wob, y + lift, z * wob);
      }
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, mt);
      mesh.position.set(cx + Math.cos(a) * r, baseY + h / 2, cz + Math.sin(a) * r);
      mesh.rotation.y = rng() * 3;
      group.add(mesh);
      if (snowCaps && h > hMin + (hMax - hMin) * 0.35) {
        const ch = h * 0.34;
        const c = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.34, ch, 7), cap);
        c.position.set(mesh.position.x, baseY + h - ch / 2 + 0.2, mesh.position.z);
        c.rotation.y = mesh.rotation.y;
        group.add(c);
      }
    }
  };

  const cityBlocks = (opts: { pitch: number; range: number; minR: number; hMin: number; hMax: number; color: string; boost?: number; skipRect?: boolean }) => {
    const wt = makeWindowTextures(opts.color);
    const mat = new THREE.MeshStandardMaterial({
      map: wt.map,
      emissiveMap: wt.emissive,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0,
      roughness: 0.55,
      metalness: 0.15,
    });
    updaters.push((_dt, glow) => {
      mat.emissiveIntensity = glow * 1.5;
    });
    for (let gx = -opts.range; gx <= opts.range; gx += opts.pitch) {
      for (let gz = -opts.range; gz <= opts.range; gz += opts.pitch) {
        const x = cx + gx + (rng() - 0.5) * opts.pitch * 0.25;
        const z = cz + gz + (rng() - 0.5) * opts.pitch * 0.25;
        const dist = Math.hypot(x - cx, z - cz);
        if (dist < opts.minR || rng() < 0.1) continue;
        if (opts.skipRect && inFootprint(x, z, 14)) continue;
        let h = opts.hMin + Math.pow(rng(), 1.8) * (opts.hMax - opts.hMin);
        if (opts.boost && dist > 150 && rng() < 0.2) h *= opts.boost;
        const w = opts.pitch * (0.5 + rng() * 0.3);
        const d = opts.pitch * (0.5 + rng() * 0.3);
        const geo = new THREE.BoxGeometry(w, h, d);
        scaleBoxUV(geo, w, h, d);
        const b = new THREE.Mesh(geo, mat);
        b.position.set(x, h / 2, z);
        group.add(b);
      }
    }
  };

  const seaPlane = (y: number, color: string, size = 6000) => {
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(size, size), smat(color, 0.12, 0.05));
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(cx, y, cz);
    group.add(sea);
    return sea;
  };

  const landBox = (landZ: number, topColor: string, depth: number, sideColor: string) => {
    const top = gmat(topColor);
    const side = smat(sideColor, 1);
    const geo = new THREE.BoxGeometry(1400, depth, landZ + 700);
    const land = new THREE.Mesh(geo, [side, side, top, side, side, side]);
    land.position.set(cx, -0.05 - depth / 2, (landZ - 700) / 2);
    land.receiveShadow = true;
    group.add(land);
  };

  const ground = palette(spec);

  switch (spec.setting) {
    case "ocean":
    case "riviera": {
      const landZ = ex.maxZ + 16;
      landBox(landZ, ground, 26, "#8a7f72");
      const sea = seaPlane(-18, spec.setting === "ocean" ? "#2f7fa8" : "#2b72a0");
      sea.receiveShadow = false;
      for (let i = 0; i < 16; i++) {
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5 + rng() * 3, 0), m.rock);
        r.position.set(cx + (rng() - 0.5) * 220, -17 + rng() * 2, landZ + 1 + rng() * 10);
        r.scale.y = 0.7;
        group.add(r);
      }
      mountains(12, 700, 1100, 60, 170, spec.setting === "ocean" ? "#6f8560" : "#8e9c80", false, Math.PI * 1.05, Math.PI * 1.95);
      if (spec.setting === "ocean") {
        scatter(14, 18, 60, (_x, z) => z < landZ - 5, (x, z) => palm(x, 0, z, 0.9 + rng() * 0.5));
        scatter(22, 14, 55, (_x, z) => z < landZ - 3, (x, z) => bush(x, 0, z, 0.8 + rng()));
      } else {
        scatter(22, 16, 60, (_x, z) => z < landZ - 5, (x, z) => cypress(x, 0, z, 0.9 + rng() * 0.6));
        scatter(10, 18, 60, (_x, z) => z < landZ - 5, (x, z) => pine(x, 0, z, 0.9 + rng() * 0.5));
        scatter(20, 14, 55, (_x, z) => z < landZ - 3, (x, z) => bush(x, 0, z, 0.8 + rng()));
      }
      break;
    }
    case "island": {
      const sea = seaPlane(-0.9, "#2fa7c0");
      sea.receiveShadow = false;
      const shallows = new THREE.Mesh(new THREE.CylinderGeometry(190, 190, 0.1, 64), smat("#7edbd2", 0.15, 0.05));
      shallows.position.set(cx, -0.8, cz);
      group.add(shallows);
      const sand = new THREE.Mesh(new THREE.CylinderGeometry(98, 104, 3, 64), gmat("#ecdcb5"));
      sand.position.set(cx, -0.05 - 1.5 - 0.02, cz);
      sand.receiveShadow = true;
      group.add(sand);
      const lawn = new THREE.Mesh(new THREE.CylinderGeometry(72, 80, 3, 64), gmat("#86a56e"));
      lawn.position.set(cx, -0.05 - 1.5 + 0.0, cz);
      lawn.receiveShadow = true;
      group.add(lawn);
      const jetty = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 80), m.wood);
      jetty.position.set(cx + 34, 0.0, cz + 100);
      jetty.receiveShadow = true;
      group.add(jetty);
      for (let k = 0; k < 14; k++) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 6), m.woodDark);
        post.position.set(cx + 34 + (k % 2 ? 1.4 : -1.4), -0.6, cz + 62 + k * 5.2);
        group.add(post);
      }
      const boat = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, 22), smat("#f2f2f2", 0.3, 0.2));
      hull.position.y = 0.2;
      boat.add(hull);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 8), smat("#1b2733", 0.2, 0.4));
      cabin.position.set(0, 1.8, -1);
      boat.add(cabin);
      boat.position.set(cx + 41, 0, cz + 128);
      group.add(boat);
      scatter(34, 22, 62, () => true, (x, z) => palm(x, 0, z, 0.9 + rng() * 0.6));
      scatter(24, 14, 60, () => true, (x, z) => bush(x, 0, z, 0.8 + rng()));
      break;
    }
    case "lake": {
      const landZ = ex.maxZ + 26;
      landBox(landZ, ground, 3, "#6b6a58");
      const lake = seaPlane(-1.6, "#4a85a6");
      lake.receiveShadow = false;
      const dock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 22), m.wood);
      dock.position.set(cx + 24, -0.5, landZ + 8);
      group.add(dock);
      const bh = new THREE.Mesh(new THREE.BoxGeometry(7, 3.2, 9), m.wallExt);
      bh.position.set(cx + 34, 1.5, landZ - 6);
      bh.castShadow = true;
      group.add(bh);
      const bhr = new THREE.Mesh(new THREE.ConeGeometry(6.5, 2.4, 4), m.roof);
      bhr.rotation.y = Math.PI / 4;
      bhr.position.set(cx + 34, 4.4, landZ - 6);
      bhr.scale.set(1, 1, 1.15);
      group.add(bhr);
      mountains(18, 650, 1100, 160, 380, "#667a68", true);
      scatter(24, 16, 70, (_x, z) => z < landZ - 4, (x, z) => cypress(x, 0, z, 0.9 + rng() * 0.6));
      scatter(18, 16, 70, (_x, z) => z < landZ - 4, (x, z) => roundTree(x, 0, z, 0.9 + rng() * 0.6));
      scatter(14, 14, 50, (_x, z) => z < landZ - 3, (x, z) => bush(x, 0, z, 0.8 + rng()));
      break;
    }
    case "snow": {
      const snow = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), gmat("#f1f5f9", 0.95));
      snow.rotation.x = -Math.PI / 2;
      snow.position.set(cx, -0.05, cz);
      snow.receiveShadow = true;
      group.add(snow);
      const mound = new THREE.MeshStandardMaterial({ color: "#f5f8fb", roughness: 1 });
      for (let i = 0; i < 16; i++) {
        const a = rng() * Math.PI * 2;
        const r = 60 + rng() * 260;
        const mm = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), mound);
        mm.scale.set(20 + rng() * 40, 3 + rng() * 6, 20 + rng() * 40);
        mm.position.set(cx + Math.cos(a) * r, -1.2, cz + Math.sin(a) * r);
        group.add(mm);
      }
      mountains(16, 500, 1000, 200, 460, "#7d8794", true);
      scatter(46, 22, 120, () => true, (x, z) => pine(x, 0, z, 0.8 + rng() * 0.7, true));
      // snowfall
      const n = 900;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = cx + (rng() - 0.5) * 140;
        pos[i * 3 + 1] = rng() * 60;
        pos[i * 3 + 2] = cz + (rng() - 0.5) * 140;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: "#ffffff", size: 0.32, transparent: true, opacity: 0.85, depthWrite: false }));
      pts.frustumCulled = false;
      group.add(pts);
      let tt = 0;
      updaters.push((dt) => {
        tt += dt;
        const p = geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < n; i++) {
          let y = p.getY(i) - dt * (1.2 + (i % 5) * 0.2);
          if (y < 0) y = 60;
          p.setY(i, y);
          p.setX(i, p.getX(i) + Math.sin(tt * 0.6 + i) * dt * 0.35);
        }
        p.needsUpdate = true;
      });
      break;
    }
    case "skyline": {
      fogFar = 3600;
      const gr = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), smat("#1c1f25", 0.95));
      gr.rotation.x = -Math.PI / 2;
      gr.position.set(cx, 0, cz);
      gr.receiveShadow = true;
      group.add(gr);
      const wt = makeWindowTextures("#39414d");
      const shaftMat = new THREE.MeshStandardMaterial({ map: wt.map, emissiveMap: wt.emissive, emissive: new THREE.Color("#fff"), emissiveIntensity: 0, roughness: 0.3, metalness: 0.4 });
      updaters.push((_dt, glow) => {
        shaftMat.emissiveIntensity = glow * 1.2;
      });
      const sw = ex.maxX - ex.minX - 2;
      const sd = ex.maxZ - ex.minZ - 6;
      const sh = elev - SLAB;
      const shaftGeo = new THREE.BoxGeometry(sw, sh, sd);
      scaleBoxUV(shaftGeo, sw, sh, sd, 14, 22);
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(cx, sh / 2, cz - 2);
      shaft.castShadow = true;
      group.add(shaft);
      cityBlocks({ pitch: 64, range: 520, minR: 85, hMin: 25, hMax: elev * 1.05, color: "#323a46", boost: 1.5 });
      break;
    }
    case "urban": {
      const plaza = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), gmat(ground, 0.95));
      plaza.rotation.x = -Math.PI / 2;
      plaza.position.set(cx, -0.06, cz);
      plaza.receiveShadow = true;
      group.add(plaza);
      const roadZ = ex.maxZ + 9;
      const road = new THREE.Mesh(new THREE.PlaneGeometry(1600, 11), smat("#222226", 0.95));
      road.rotation.x = -Math.PI / 2;
      road.position.set(cx, -0.04, roadZ);
      road.receiveShadow = true;
      group.add(road);
      for (let x = -300; x < 300; x += 7) {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(3, 0.02, 0.2), smat("#d8d8d0", 0.9));
        dash.position.set(cx + x, -0.02, roadZ);
        group.add(dash);
      }
      const tone = new THREE.Color(spec.palette.wall).getHSL({ h: 0, s: 0, l: 0 }).l;
      const nColor = tone > 0.5 ? "#bfb7a6" : "#3a3d44";
      const wt = makeWindowTextures(nColor);
      const nMat = new THREE.MeshStandardMaterial({ map: wt.map, emissiveMap: wt.emissive, emissive: new THREE.Color("#fff"), emissiveIntensity: 0, roughness: 0.7 });
      updaters.push((_dt, glow) => {
        nMat.emissiveIntensity = glow * 1.4;
      });
      const nb = (x: number, z: number, w: number, d: number, h: number) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        scaleBoxUV(geo, w, h, d, 22, 26);
        const b = new THREE.Mesh(geo, nMat);
        b.position.set(x, h / 2, z);
        b.castShadow = true;
        b.receiveShadow = true;
        group.add(b);
      };
      const bd = ex.maxZ - ex.minZ;
      const bw = ex.maxX - ex.minX;
      nb(ex.minX - 5 - 7, cz - 4, 14, bd + 12, 12 + rng() * 10);
      nb(ex.maxX + 5 + 7, cz - 4, 14, bd + 12, 10 + rng() * 12);
      nb(cx, ex.minZ - 6 - 8, bw + 40, 16, 14 + rng() * 14);
      nb(ex.minX - 5 - 7, roadZ + 40, 30, 50, 18 + rng() * 20);
      cityBlocks({ pitch: 42, range: 360, minR: 60, hMin: 9, hMax: 60, color: nColor, skipRect: true });
      scatter(5, 10, 18, (_x, z) => z > ex.maxZ + 1 && z < roadZ - 4, (x, z) => roundTree(x, 0, z, 0.9));
      break;
    }
    case "desert": {
      const sand = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), gmat(ground, 1));
      sand.rotation.x = -Math.PI / 2;
      sand.position.set(cx, -0.05, cz);
      sand.receiveShadow = true;
      group.add(sand);
      const lawn = new THREE.Mesh(new THREE.CircleGeometry(80, 48), gmat("#7fa35a"));
      lawn.rotation.x = -Math.PI / 2;
      lawn.scale.set(1.8, 1, 1);
      lawn.position.set(cx, -0.03, ex.maxZ + 70);
      lawn.receiveShadow = true;
      group.add(lawn);
      const dune = smat(shade(ground, -0.05), 1);
      for (let i = 0; i < 12; i++) {
        const a = rng() * Math.PI * 2;
        const r = 260 + rng() * 380;
        const d = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), dune);
        d.scale.set(70 + rng() * 80, 6 + rng() * 10, 50 + rng() * 60);
        d.position.set(cx + Math.cos(a) * r, -2, cz + Math.sin(a) * r);
        group.add(d);
      }
      mountains(10, 900, 1500, 120, 260, "#b98558", false);
      scatter(12, 14, 50, () => true, (x, z) => palm(x, 0, z, 0.9 + rng() * 0.5));
      scatter(10, 30, 120, () => true, (x, z) => cactus(x, 0, z, 0.9 + rng() * 0.7));
      scatter(14, 12, 60, () => true, (x, z) => bush(x, 0, z, 0.7 + rng() * 0.6));
      break;
    }
  }

  return {
    group,
    fade,
    fogFar,
    update: (dt, glow) => {
      for (const u of updaters) u(dt, glow);
    },
  };
}

function palette(spec: ModelSpec) {
  return spec.palette.ground;
}
