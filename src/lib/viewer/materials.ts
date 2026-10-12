import * as THREE from "three";
import type { Palette } from "../types";

export const shade = (hex: string, l: number) => `#${new THREE.Color(hex).offsetHSL(0, 0, l).getHexString()}`;

function canvasTex(draw: (c: CanvasRenderingContext2D, s: number) => void, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, size);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function woodTex(base: string, horizontal = false) {
  return canvasTex((c, s) => {
    c.fillStyle = base;
    c.fillRect(0, 0, s, s);
    const pw = 32;
    for (let p = 0; p < s; p += pw) {
      c.fillStyle = shade(base, (Math.random() - 0.5) * 0.1);
      if (horizontal) c.fillRect(0, p, s, pw - 1);
      else c.fillRect(p, 0, pw - 1, s);
      c.strokeStyle = "rgba(0,0,0,0.07)";
      c.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        const o = p + Math.random() * pw;
        const w = (Math.random() - 0.5) * 5;
        c.beginPath();
        if (horizontal) {
          c.moveTo(0, o);
          c.lineTo(s, o + w);
        } else {
          c.moveTo(o, 0);
          c.lineTo(o + w, s);
        }
        c.stroke();
      }
      c.fillStyle = "rgba(0,0,0,0.25)";
      if (horizontal) c.fillRect(0, p + pw - 1, s, 1);
      else c.fillRect(p + pw - 1, 0, 1, s);
    }
  });
}

function marbleTex(base: string) {
  return canvasTex((c, s) => {
    c.fillStyle = base;
    c.fillRect(0, 0, s, s);
    for (let i = 0; i < 28; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 30 + Math.random() * 70;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${0.1 + Math.random() * 0.1})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, s, s);
    }
    c.lineCap = "round";
    for (let i = 0; i < 9; i++) {
      c.strokeStyle = `rgba(90,90,100,${0.1 + Math.random() * 0.2})`;
      c.lineWidth = 0.5 + Math.random() * 1.6;
      c.beginPath();
      let x = Math.random() * s;
      let y = 0;
      c.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (Math.random() - 0.5) * 70;
        y += s / 5;
        c.quadraticCurveTo(x + (Math.random() - 0.5) * 40, y - s / 10, x, y);
      }
      c.stroke();
    }
    c.strokeStyle = "rgba(0,0,0,0.10)";
    c.lineWidth = 1;
    c.strokeRect(0.5, 0.5, s - 1, s - 1);
  });
}

function stoneTex(base: string, grid = true) {
  return canvasTex((c, s) => {
    c.fillStyle = base;
    c.fillRect(0, 0, s, s);
    for (let i = 0; i < 1600; i++) {
      c.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
      c.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    if (grid) {
      c.strokeStyle = "rgba(0,0,0,0.13)";
      c.lineWidth = 1;
      c.strokeRect(0.5, 0.5, s - 1, s - 1);
      c.beginPath();
      c.moveTo(s / 2, 0);
      c.lineTo(s / 2, s);
      c.moveTo(0, s / 2);
      c.lineTo(s, s / 2);
      c.stroke();
    }
  });
}

export interface WindowTex {
  map: THREE.CanvasTexture;
  emissive: THREE.CanvasTexture;
}

export function makeWindowTextures(wall: string): WindowTex {
  const cells = 8;
  const lit: boolean[] = [];
  for (let i = 0; i < cells * cells; i++) lit.push(Math.random() > 0.52);
  const draw = (emit: boolean) =>
    canvasTex((c, s) => {
      c.fillStyle = emit ? "#000" : wall;
      c.fillRect(0, 0, s, s);
      const cs = s / cells;
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          const on = lit[y * cells + x];
          if (emit) {
            if (!on) continue;
            c.fillStyle = "#ffcf8a";
          } else {
            c.fillStyle = on ? "#c9b88a" : "#2a3340";
          }
          c.fillRect(x * cs + cs * 0.18, y * cs + cs * 0.22, cs * 0.64, cs * 0.5);
        }
      }
    }, 128);
  return { map: draw(false), emissive: draw(true) };
}

export interface Mats {
  wallExt: THREE.MeshStandardMaterial;
  wallInt: THREE.MeshStandardMaterial;
  slab: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  fabric: THREE.MeshStandardMaterial;
  fabricDark: THREE.MeshStandardMaterial;
  rug: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  marble: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  water: THREE.MeshStandardMaterial;
  lamp: THREE.MeshStandardMaterial;
  fire: THREE.MeshStandardMaterial;
  screen: THREE.MeshStandardMaterial;
  mirror: THREE.MeshStandardMaterial;
  door: THREE.MeshStandardMaterial;
  bottle: THREE.MeshStandardMaterial;
  leaf: THREE.MeshStandardMaterial;
  leafDark: THREE.MeshStandardMaterial;
  trunk: THREE.MeshStandardMaterial;
  snow: THREE.MeshStandardMaterial;
  rock: THREE.MeshStandardMaterial;
  books: THREE.MeshStandardMaterial[];
  art: THREE.MeshStandardMaterial[];
  cars: THREE.MeshStandardMaterial[];
  floors: Record<"wood" | "marble" | "stone" | "concrete" | "deck", THREE.MeshStandardMaterial>;
  list: THREE.Material[];
  textures: THREE.Texture[];
  setGlow: (g: number) => void;
}

export function createMaterials(p: Palette): Mats {
  const list: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const std = (color: string, rough = 0.8, metal = 0, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
    list.push(m);
    return m;
  };
  const withTex = (m: THREE.MeshStandardMaterial, t: THREE.Texture) => {
    m.map = t;
    m.color.set("#ffffff");
    textures.push(t);
    return m;
  };

  const intColor = new THREE.Color(p.wall).lerp(new THREE.Color("#ebe6dc"), 0.5).getStyle();
  const accentDark = shade(p.accent, -0.12);

  const woodT = woodTex(p.floor);
  const marbleT = marbleTex(shade(p.floor, 0.18));
  const stoneT = stoneTex(shade(p.floor, -0.12));
  const concT = stoneTex("#8d8d90", false);
  const deckT = woodTex(shade(p.accent, -0.05), true);

  const floors = {
    wood: withTex(std("#fff", 0.55, 0), woodT),
    marble: withTex(std("#fff", 0.2, 0.05), marbleT),
    stone: withTex(std("#fff", 0.7, 0), stoneT),
    concrete: withTex(std("#fff", 0.9, 0), concT),
    deck: withTex(std("#fff", 0.75, 0), deckT),
  };

  const glass = std(p.glass, 0.04, 0.2, {
    transparent: true,
    opacity: 0.3,
    emissive: new THREE.Color("#ffc680"),
    emissiveIntensity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const lamp = std("#ffe9c4", 0.4, 0, { emissive: new THREE.Color("#ffd49a"), emissiveIntensity: 0.9 });
  const fire = std("#ff9a3c", 0.5, 0, { emissive: new THREE.Color("#ff6a00"), emissiveIntensity: 2 });
  const screen = std("#101826", 0.3, 0, { emissive: new THREE.Color("#3d7bff"), emissiveIntensity: 0.9 });
  const water = std("#4fc3d6", 0.06, 0, {
    emissive: new THREE.Color("#18a9c9"),
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: 0.92,
  });

  const mats: Mats = {
    wallExt: std(p.wall, 0.85),
    wallInt: std(intColor, 0.9),
    slab: std(shade(p.wall, -0.04), 0.9),
    roof: std(p.roof, 0.7, 0.05),
    glass,
    frame: std("#2a2927", 0.4, 0.7),
    metal: std("#aeb2b8", 0.28, 0.9),
    brass: std("#c8a45f", 0.3, 1),
    wood: std(p.accent, 0.6),
    woodDark: std(accentDark, 0.6),
    fabric: std("#e5ddcf", 0.95),
    fabricDark: std("#3c3a3a", 0.95),
    rug: std("#cfc4b0", 1),
    dark: std("#151517", 0.6, 0.2),
    marble: withTex(std("#fff", 0.18, 0.05), marbleTex("#efece6")),
    stone: std("#8e877c", 0.85),
    water,
    lamp,
    fire,
    screen,
    mirror: std("#cfd8de", 0.05, 1),
    door: std(shade(p.accent, -0.05), 0.55),
    bottle: std("#1f3a2a", 0.3, 0.1),
    leaf: std("#4d7a46", 0.9),
    leafDark: std("#2f5a3f", 0.9),
    trunk: std("#6b5640", 0.95),
    snow: std("#f4f7fb", 0.95),
    rock: std("#8a8379", 0.95),
    books: [std("#7b3f3a", 0.8), std("#2f4a5a", 0.8), std("#c5b08a", 0.8), std("#3e5b3f", 0.8)],
    art: [std("#b5452f", 0.7), std("#e4b24a", 0.7), std("#2d5f7a", 0.7), std("#e9e1d3", 0.7), std("#1c1c1e", 0.7)],
    cars: [std("#b11f2b", 0.25, 0.6), std("#1d2a46", 0.25, 0.6), std("#cfcfd3", 0.25, 0.7), std("#0e0e10", 0.2, 0.7)],
    floors,
    list,
    textures,
    setGlow: () => {},
  };
  mats.setGlow = (g: number) => {
    glass.emissiveIntensity = g * 0.5;
    lamp.emissiveIntensity = 0.5 + g * 2.2;
    fire.emissiveIntensity = 1.4 + g * 1.4;
    screen.emissiveIntensity = 0.7 + g * 0.8;
    water.emissiveIntensity = 0.2 + g * 0.9;
  };
  return mats;
}
