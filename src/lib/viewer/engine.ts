import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  SLAB,
  WALL_EXT,
  WALL_INT,
  computeLayout,
  type FloorLayout,
  type Layout,
  type Opening,
  type RoomLayout,
  type WallSeg,
} from "../layout";
import type { ModelSpec, RoomKind } from "../types";
import { buildEnvironment, type Env } from "./environment";
import { box, cyl, furnishRoom, furnishTerrace } from "./furniture";
import { createMaterials, type Mats } from "./materials";

export type TimeOfDay = "day" | "dusk" | "night";
export type ViewMode = "exterior" | "floor" | "room" | "walk";

export interface ObjectInfo {
  id: string;
  name: string;
  desc: string;
  floor: number;
  roomId: string;
  roomName: string;
}

export interface ViewState {
  ready: boolean;
  mode: ViewMode;
  floor: number | null;
  roomId: string | null;
  objectId: string | null;
  time: TimeOfDay;
  explode: number;
  xray: boolean;
  roofLifted: boolean;
  facadeOpen: boolean;
  isolate: boolean;
  hidden: number[];
  flying: boolean;
}

export interface EngineOptions {
  hero?: boolean;
  onState?: (s: ViewState) => void;
}

interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface DoorRT {
  kind: Opening["kind"];
  t: number;
  manual: boolean;
  update: (t: number) => void;
  ax: number;
  az: number;
  bx: number;
  bz: number;
}

interface RoomRT {
  layout: RoomLayout;
  overlay: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  alpha: number;
  floor: number;
}

interface FloorRT {
  index: number;
  fl: FloorLayout;
  group: THREE.Group;
  walls: THREE.Group;
  cap: THREE.Mesh | null;
  rooms: RoomRT[];
  doors: DoorRT[];
  colliders: AABB[];
  bounds: AABB;
  wallScale: number;
}

interface ObjRT {
  info: ObjectInfo;
  group: THREE.Group;
}

type Pick =
  | { type: "floor"; floor: number }
  | { type: "room"; id: string }
  | { type: "object"; id: string }
  | { type: "door"; floor: number; idx: number };

interface TimeProfile {
  skyTop: string;
  skyBot: string;
  sun: string;
  sunI: number;
  sunPos: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  env: number;
  exposure: number;
  glow: number;
  star: number;
  fog: string;
}

const TIMES: Record<TimeOfDay, TimeProfile> = {
  day: { skyTop: "#3f83c9", skyBot: "#cfe0f0", sun: "#fff0d6", sunI: 2.6, sunPos: [70, 95, 45], hemiSky: "#ffffff", hemiGround: "#8d8d86", hemiI: 0.4, env: 0.6, exposure: 0.88, glow: 0, star: 0, fog: "#cfdceb" },
  dusk: { skyTop: "#27305f", skyBot: "#f0a06c", sun: "#ffb07a", sunI: 2.5, sunPos: [-80, 22, 52], hemiSky: "#ffd9c0", hemiGround: "#5a4a58", hemiI: 0.5, env: 0.5, exposure: 1.0, glow: 0.65, star: 0.25, fog: "#d79b7c" },
  night: { skyTop: "#03050d", skyBot: "#16223f", sun: "#9fb6ff", sunI: 0.55, sunPos: [40, 70, -40], hemiSky: "#8fa6d8", hemiGround: "#20263a", hemiI: 0.45, env: 0.3, exposure: 1.1, glow: 1, star: 1, fog: "#0d1630" },
};

const FLOOR_MAT: Record<RoomKind, "wood" | "marble" | "stone" | "concrete" | "deck"> = {
  living: "wood",
  kitchen: "stone",
  dining: "wood",
  bedroom: "wood",
  master: "wood",
  bath: "marble",
  entry: "marble",
  library: "wood",
  cinema: "concrete",
  spa: "marble",
  gym: "concrete",
  wine: "stone",
  garage: "concrete",
  office: "wood",
  lounge: "wood",
  gallery: "marble",
  kids: "wood",
  pool: "marble",
  staff: "concrete",
  terrace: "deck",
};

const GAP = 7;
const EYE = 1.65;
const PASSABLE = new Set<Opening["kind"]>(["door", "arch", "main", "slider", "garage"]);

const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const damp = (cur: number, target: number, rate: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    const list = Array.isArray(mat) ? mat : mat ? [mat] : [];
    for (const mt of list) {
      const rec = mt as unknown as Record<string, unknown>;
      for (const k of Object.keys(rec)) {
        const v = rec[k];
        if (v instanceof THREE.Texture) v.dispose();
      }
      mt.dispose();
    }
  });
}

function gableGeometry(short: number, long: number, rise: number) {
  const s = new THREE.Shape();
  s.moveTo(-short / 2, 0);
  s.lineTo(short / 2, 0);
  s.lineTo(0, rise);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: long, bevelEnabled: false });
  geo.translate(0, 0, -long / 2);
  return geo;
}

export class ViewerEngine {
  private opts: EngineOptions;
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private overlay: HTMLDivElement;
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private headlamp: THREE.PointLight;
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private stars: THREE.Points;
  private highlight: THREE.LineSegments;
  private envTex: THREE.Texture | null = null;

  private world = new THREE.Group();
  private building = new THREE.Group();
  private roof = new THREE.Group();
  private env: Env | null = null;
  private mats!: Mats;
  private spec!: ModelSpec;
  private layout!: Layout;
  private floors: FloorRT[] = [];
  private objects: ObjRT[] = [];
  private roomMap = new Map<string, RoomRT>();

  private raf = 0;
  private running = false;
  private last = 0;
  private clock = 0;
  private disposed = false;
  private io: IntersectionObserver | null = null;
  private ro: ResizeObserver | null = null;

  private tween: { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; e: number; dur: number; done?: () => void } | null = null;
  private labels = new Map<string, { el: HTMLButtonElement; pos: () => THREE.Vector3 }>();
  private tmpV = new THREE.Vector3();
  private tmpC = new THREE.Color();

  private explodeCur = 0;
  private liftCur = 0;
  private xrayCur = 0;
  private terrainCur = 1;
  private hidden = new Set<number>();
  private hoverRoom: string | null = null;
  private sideHover: string | null = null;

  private walk = { yaw: 0, pitch: 0, floor: 0, x: 0, z: 0, y: 0, active: false, keys: new Set<string>(), vf: 0, vs: 0, dragging: false, bob: 0 };

  private cur = {
    skyTop: new THREE.Color(),
    skyBot: new THREE.Color(),
    sun: new THREE.Color(),
    hemiSky: new THREE.Color(),
    hemiGround: new THREE.Color(),
    fog: new THREE.Color(),
    sunDir: new THREE.Vector3(0.5, 0.8, 0.3),
    sunI: 3,
    hemiI: 0.5,
    env: 0.8,
    exposure: 1,
    glow: 0,
    star: 0,
  };

  state: ViewState = {
    ready: false,
    mode: "exterior",
    floor: null,
    roomId: null,
    objectId: null,
    time: "day",
    explode: 0,
    xray: false,
    roofLifted: false,
    facadeOpen: false,
    isolate: false,
    hidden: [],
    flying: false,
  };
  private explodeT = 0;
  private lastMean = 0;
  private lastFac = 1;

  private downPos = { x: 0, y: 0, t: 0 };
  private lastHover = 0;
  private lookLast = { x: 0, y: 0 };

  constructor(container: HTMLElement, opts: EngineOptions = {}) {
    this.opts = opts;
    this.container = container;
    const hero = !!opts.hero;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, hero ? 1.5 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0x0b0b0d);
    const canvas = this.renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none;";
    container.appendChild(canvas);

    this.overlay = document.createElement("div");
    this.overlay.className = "vlayer";
    container.appendChild(this.overlay);

    this.camera = new THREE.PerspectiveCamera(hero ? 38 : 55, 1, 0.15, 5000);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.9;
    this.controls.screenSpacePanning = true;
    this.controls.enabled = !hero;
    if (!hero) {
      container.tabIndex = 0;
      this.controls.listenToKeyEvents(container);
      container.style.outline = "none";
    }

    // lights
    this.hemi = new THREE.HemisphereLight("#ffffff", "#888888", 0.5);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffffff", 3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(hero ? 1536 : 2048, hero ? 1536 : 2048);
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.06;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.headlamp = new THREE.PointLight("#ffe3bd", 0, 16, 1.4);
    this.camera.add(this.headlamp);

    const pm = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTex;
    pm.dispose();

    // sky
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color() },
        bot: { value: new THREE.Color() },
        sunDir: { value: new THREE.Vector3(0, 1, 0) },
        sunCol: { value: new THREE.Color() },
      },
      vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 top; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          float h = clamp(d.y * 1.15 + 0.06, 0.0, 1.0);
          vec3 col = mix(bot, top, pow(h, 0.5));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          col += sunCol * (pow(s, 90.0) * 0.9 + pow(s, 7.0) * 0.22);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 16), this.skyMat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);

    const sp = new Float32Array(1400 * 3);
    for (let i = 0; i < 1400; i++) {
      const u = Math.random();
      const v = 0.08 + Math.random() * 0.92;
      const th = u * Math.PI * 2;
      const r = Math.sqrt(1 - v * v);
      sp[i * 3] = Math.cos(th) * r * 2200;
      sp[i * 3 + 1] = v * 2200;
      sp[i * 3 + 2] = Math.sin(th) * r * 2200;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: "#ffffff", size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    // highlight outline for selected objects
    this.highlight = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: "#e8c77a", transparent: true, opacity: 0.95, depthTest: false }),
    );
    this.highlight.visible = false;
    this.highlight.renderOrder = 20;
    this.scene.add(this.highlight);

    this.scene.add(this.world);

    // events
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointerleave", this.onLeave);
    container.addEventListener("keydown", this.onKeyDown);
    container.addEventListener("keyup", this.onKeyUp);
    container.addEventListener("blur", this.onBlur);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.io = new IntersectionObserver((entries) => {
      for (const e of entries) this.setRunning(e.isIntersecting && !document.hidden);
    });
    this.io.observe(container);
    document.addEventListener("visibilitychange", this.onVis);
    this.resize();
  }

  // ------------------------------------------------------------------ public API
  getLayout() {
    return this.layout;
  }
  getObjects(): ObjectInfo[] {
    return this.objects.map((o) => o.info);
  }

  load(spec: ModelSpec) {
    this.clearWorld();
    this.spec = spec;
    this.layout = computeLayout(spec);
    this.mats = createMaterials(spec.palette);
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.buildBuilding();
    this.env = buildEnvironment(spec, this.layout, this.mats);
    this.world.add(this.env.group);
    this.scene.fog = new THREE.Fog(0xcfdceb, 220, this.env.fogFar);

    const { W, D, H } = this.metrics();
    const R = Math.max(W, D) * 0.9 + H + 25;
    const s = this.sun.shadow.camera;
    s.left = -R;
    s.right = R;
    s.top = R;
    s.bottom = -R;
    s.near = 1;
    s.far = 700;
    s.updateProjectionMatrix();

    this.hidden.clear();
    this.explodeCur = this.explodeT = this.liftCur = 0;
    this.lastMean = 0;
    this.lastFac = 1;
    Object.assign(this.state, {
      ready: true,
      mode: "exterior" as ViewMode,
      floor: null,
      roomId: null,
      objectId: null,
      explode: 0,
      roofLifted: false,
      facadeOpen: false,
      xray: false,
      isolate: false,
      hidden: [],
      flying: false,
    });
    this.tween = null;
    this.walk.active = false;
    this.configControls("exterior");
    const pose = this.extPose(false);
    this.camera.position.copy(pose.pos);
    this.controls.target.copy(pose.tgt);
    this.controls.maxDistance = pose.R * 4;
    this.controls.update();
    this.stepTime(1, 0);
    this.syncLabels();
    this.emit();
  }

  setTime(t: TimeOfDay) {
    this.state.time = t;
    this.emit();
  }
  setExplode(v: number) {
    this.explodeT = Math.max(0, Math.min(1, v));
    this.state.explode = this.explodeT;
    this.emit();
  }
  setXray(b: boolean) {
    this.state.xray = b;
    this.emit();
  }
  setRoofLifted(b: boolean) {
    this.state.roofLifted = b;
    this.emit();
  }
  setFacadeOpen(b: boolean) {
    this.state.facadeOpen = b;
    this.emit();
  }
  setIsolate(b: boolean) {
    this.state.isolate = b;
    this.emit();
  }
  toggleFloorHidden(i: number) {
    if (this.hidden.has(i)) this.hidden.delete(i);
    else this.hidden.add(i);
    this.emit();
  }
  highlightRoom(id: string | null) {
    this.sideHover = id;
  }

  setMoveInput(f: number, s: number) {
    this.walk.vf = f;
    this.walk.vs = s;
  }

  showExterior(aerial = false) {
    this.leaveWalk();
    this.state.mode = "exterior";
    this.state.floor = null;
    this.state.roomId = null;
    this.state.objectId = null;
    this.highlight.visible = false;
    this.configControls("exterior");
    const p = this.extPose(aerial);
    this.flyTo(p.pos, p.tgt, 2.0);
    this.syncLabels();
    this.emit();
  }

  focusFloor(i: number) {
    if (!this.floors[i]) return;
    this.leaveWalk();
    this.state.mode = "floor";
    this.state.floor = i;
    this.state.roomId = null;
    this.state.objectId = null;
    this.highlight.visible = false;
    this.configControls("floor");
    const { W, D, cx, cz } = this.metrics();
    const fy = this.floorWorldY(i);
    const tgt = new THREE.Vector3(cx, fy + 0.4, cz);
    const dist = Math.max(W, D) * 0.62 + 5;
    const pos = new THREE.Vector3(cx + W * 0.08, fy + dist * 0.95, cz + dist * 0.75);
    this.flyTo(pos, tgt, 1.8);
    this.syncLabels();
    this.emit();
  }

  flyToRoom(id: string) {
    const r = this.roomMap.get(id);
    if (!r) return;
    this.leaveWalk();
    const l = r.layout;
    this.state.mode = "room";
    this.state.floor = r.floor;
    this.state.roomId = id;
    this.state.objectId = null;
    this.highlight.visible = false;
    this.configControls("room");
    const fy = this.floorWorldY(r.floor);
    const ceil = this.floors[r.floor].fl.height - SLAB;
    const px = l.x + l.w - Math.min(0.9, l.w * 0.2);
    const pz = l.z + l.d - Math.min(0.9, l.d * 0.2);
    const pos = new THREE.Vector3(px, fy + Math.min(1.7, ceil - 0.6), pz);
    const tgt = new THREE.Vector3(l.x + l.w * 0.45, fy + 0.95, l.z + l.d * 0.45);
    this.flyTo(pos, tgt, 2.0);
    this.syncLabels();
    this.emit();
  }

  flyToObject(id: string, fly = true) {
    const o = this.objects.find((x) => x.info.id === id);
    if (!o) return;
    const r = this.roomMap.get(o.info.roomId);
    if (!r) return;
    if (this.state.mode === "walk") {
      this.selectObject(id);
      return;
    }
    this.state.mode = "room";
    this.state.floor = r.floor;
    this.state.roomId = r.layout.id;
    this.configControls("room");
    this.selectObject(id);
    if (!fly) return;
    this.building.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(o.group);
    const size = bb.getSize(new THREE.Vector3());
    const ctr = bb.getCenter(new THREE.Vector3());
    const l = r.layout;
    const rc = new THREE.Vector3(l.x + l.w / 2, ctr.y, l.z + l.d / 2);
    const dir = rc.clone().sub(ctr);
    dir.y = 0;
    if (dir.length() < 0.8) dir.set(0.4, 0, 1);
    dir.normalize();
    const dist = Math.max(2.8, Math.max(size.x, size.z) * 1.15 + size.y * 0.6);
    const pos = ctr.clone().addScaledVector(dir, dist);
    const fy = this.floorWorldY(r.floor);
    pos.y = fy + Math.min(1.75, ctr.y - fy + 0.9 + size.y * 0.3);
    pos.x = Math.min(Math.max(pos.x, l.x + 0.45), l.x + l.w - 0.45);
    pos.z = Math.min(Math.max(pos.z, l.z + 0.45), l.z + l.d - 0.45);
    this.flyTo(pos, ctr, 1.7);
    this.syncLabels();
    this.emit();
  }

  enterWalk(roomId?: string) {
    const g = this.layout.groundIndex;
    let r = roomId ? this.roomMap.get(roomId) : this.state.roomId ? this.roomMap.get(this.state.roomId) : undefined;
    if (!r) {
      const f = this.floors[g];
      const entry = f.rooms.find((x) => x.layout.kind === "entry") ?? f.rooms[0];
      r = entry;
    }
    const l = r.layout;
    const rt = this.floors[r.floor];
    this.state.mode = "walk";
    this.state.floor = r.floor;
    this.state.roomId = l.id;
    this.state.objectId = null;
    this.highlight.visible = false;
    this.controls.enabled = false;
    this.walk.floor = r.floor;
    this.walk.x = Math.min(Math.max(l.x + l.w / 2, rt.bounds.minX), rt.bounds.maxX);
    this.walk.z = Math.min(Math.max(l.z + l.d / 2, rt.bounds.minZ), rt.bounds.maxZ);
    const fy = this.floorWorldY(r.floor);
    const pos = new THREE.Vector3(this.walk.x, fy + EYE, this.walk.z);
    const yaw = l.d >= l.w ? 0 : Math.PI / 2;
    const tgt = pos.clone().add(new THREE.Vector3(-Math.sin(yaw) * 3, -0.1, -Math.cos(yaw) * 3));
    this.flyTo(pos, tgt, 2.2, () => {
      const dir = this.controls.target.clone().sub(this.camera.position).normalize();
      this.walk.yaw = Math.atan2(-dir.x, -dir.z);
      this.walk.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
      this.walk.y = this.camera.position.y;
      this.walk.active = true;
      this.container.focus({ preventScroll: true });
    });
    this.syncLabels();
    this.emit();
  }

  exitWalk() {
    if (this.state.mode !== "walk") return;
    const dir = new THREE.Vector3(-Math.sin(this.walk.yaw), Math.sin(this.walk.pitch), -Math.cos(this.walk.yaw));
    this.walk.active = false;
    this.state.mode = "room";
    this.configControls("room");
    this.controls.target.copy(this.camera.position).addScaledVector(dir, 3);
    this.controls.enabled = true;
    this.controls.update();
    this.syncLabels();
    this.emit();
  }

  walkToFloor(i: number) {
    const rt = this.floors[i];
    if (!rt) return;
    // find the room under the current position, otherwise the first room
    const px = this.walk.x;
    const pz = this.walk.z;
    const here = rt.rooms.find((r) => px >= r.layout.x && px <= r.layout.x + r.layout.w && pz >= r.layout.z && pz <= r.layout.z + r.layout.d) ?? rt.rooms[0];
    this.walk.active = false;
    const l = here.layout;
    this.walk.floor = i;
    this.walk.x = Math.min(Math.max(px, l.x + 0.6), l.x + l.w - 0.6);
    this.walk.z = Math.min(Math.max(pz, l.z + 0.6), l.z + l.d - 0.6);
    if (rt.bounds) {
      this.walk.x = Math.min(Math.max(this.walk.x, rt.bounds.minX), rt.bounds.maxX);
      this.walk.z = Math.min(Math.max(this.walk.z, rt.bounds.minZ), rt.bounds.maxZ);
    }
    this.state.floor = i;
    this.state.roomId = here.layout.id;
    const fy = this.floorWorldY(i);
    const pos = new THREE.Vector3(this.walk.x, fy + EYE, this.walk.z);
    const dir = new THREE.Vector3(-Math.sin(this.walk.yaw), Math.sin(this.walk.pitch), -Math.cos(this.walk.yaw));
    this.flyTo(pos, pos.clone().addScaledVector(dir, 3), 1.4, () => {
      this.walk.y = this.camera.position.y;
      this.walk.active = true;
    });
    this.emit();
  }

  selectObject(id: string | null) {
    this.state.objectId = id;
    this.highlight.visible = !!id;
    this.syncLabels();
    this.emit();
  }

  dispose() {
    this.disposed = true;
    this.setRunning(false);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.onDown);
    canvas.removeEventListener("pointermove", this.onMove);
    canvas.removeEventListener("pointerup", this.onUp);
    canvas.removeEventListener("pointerleave", this.onLeave);
    this.container.removeEventListener("keydown", this.onKeyDown);
    this.container.removeEventListener("keyup", this.onKeyUp);
    this.container.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVis);
    this.ro?.disconnect();
    this.io?.disconnect();
    this.controls.dispose();
    this.clearWorld();
    disposeTree(this.scene);
    this.envTex?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
    this.overlay.remove();
  }

  // ------------------------------------------------------------------ internals
  private emit() {
    this.state.hidden = [...this.hidden];
    this.opts.onState?.({ ...this.state, hidden: [...this.hidden] });
  }

  private clearWorld() {
    for (const l of this.labels.values()) l.el.remove();
    this.labels.clear();
    this.scene.remove(this.world);
    disposeTree(this.world);
    if (this.mats) {
      for (const m of this.mats.list) m.dispose();
      for (const t of this.mats.textures) t.dispose();
    }
    this.floors = [];
    this.objects = [];
    this.roomMap.clear();
    this.building = new THREE.Group();
    this.roof = new THREE.Group();
    this.env = null;
  }

  private metrics() {
    const ex = this.layout.extents;
    const W = ex.maxX - ex.minX;
    const D = ex.maxZ - ex.minZ;
    const H = ex.maxY - ex.minY;
    return { W, D, H, cx: (ex.minX + ex.maxX) / 2, cz: (ex.minZ + ex.maxZ) / 2, midY: this.layout.elevation + (ex.minY + ex.maxY) / 2 };
  }

  private extPose(aerial: boolean) {
    const { W, D, H, cx, cz, midY } = this.metrics();
    const R = Math.max(W, D) * 1.0 + H * 1.1 + 8;
    const e = this.explodeT;
    const n = this.floors.length;
    const tgt = new THREE.Vector3(cx, midY - H * 0.12 + ((n - 1) / 2 - this.layout.groundIndex) * GAP * e, cz);
    const fac = 1 + 0.55 * e;
    const pos = aerial
      ? new THREE.Vector3(cx + R * 0.12, tgt.y + R * 1.2, cz + R * 0.4)
      : new THREE.Vector3(cx + R * 0.62, tgt.y + R * 0.34, cz + R * 0.8);
    pos.sub(tgt).multiplyScalar(fac).add(tgt);
    return { pos, tgt, R: R * fac };
  }

  private floorWorldY(i: number) {
    const rt = this.floors[i];
    const g = this.layout.groundIndex;
    return this.layout.elevation + rt.fl.y + (i - g) * GAP * this.explodeT;
  }

  private configControls(mode: ViewMode) {
    const c = this.controls;
    const tall = this.layout && this.layout.elevation > 10;
    if (mode === "room" || mode === "walk") {
      c.minDistance = 0.25;
      c.maxDistance = 9;
      c.minPolarAngle = 0.05;
      c.maxPolarAngle = Math.PI - 0.05;
    } else if (mode === "floor") {
      c.minDistance = 4;
      c.maxDistance = 140;
      c.minPolarAngle = 0;
      c.maxPolarAngle = Math.PI * 0.49;
    } else {
      c.minDistance = 4;
      c.maxDistance = 520;
      c.minPolarAngle = 0;
      c.maxPolarAngle = tall ? Math.PI * 0.8 : Math.PI * 0.495;
    }
  }

  private flyTo(pos: THREE.Vector3, tgt: THREE.Vector3, dur = 1.8, done?: () => void) {
    this.tween = { p0: this.camera.position.clone(), t0: this.controls.target.clone(), p1: pos.clone(), t1: tgt.clone(), e: 0, dur, done };
    this.controls.enabled = false;
    this.state.flying = true;
    if (this.opts.hero) return;
    this.emit();
  }

  private leaveWalk() {
    if (this.state.mode === "walk") {
      this.walk.active = false;
    }
  }

  private setRunning(on: boolean) {
    if (this.disposed) return;
    if (on && !this.running) {
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    } else if (!on && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
  }

  private onVis = () => {
    if (document.hidden) this.setRunning(false);
    else {
      const r = this.container.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) this.setRunning(true);
    }
  };

  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    if (this.opts.hero) {
      if (w >= 1024) this.camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
      else this.camera.clearViewOffset();
    }
    this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------ building
  private buildBuilding() {
    const { layout, spec } = this;
    this.building.position.y = layout.elevation;
    this.world.add(this.building);
    const g = layout.groundIndex;
    const mats = this.mats;

    layout.floors.forEach((fl) => {
      const fg = new THREE.Group();
      fg.position.y = fl.y;
      fg.userData.floorIndex = fl.index;
      const walls = new THREE.Group();
      const rt: FloorRT = {
        index: fl.index,
        fl,
        group: fg,
        walls,
        cap: null,
        rooms: [],
        doors: [],
        colliders: [],
        bounds: { minX: fl.slab.x + 0.45, maxX: fl.slab.x + fl.slab.w - 0.45, minZ: fl.slab.z + 0.45, maxZ: fl.slab.z + fl.slab.d - 0.45 },
        wallScale: 1,
      };
      const underground = fl.index < g;

      // slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(fl.slab.w, SLAB, fl.slab.d), mats.slab);
      slab.position.set(fl.slab.x + fl.slab.w / 2, -SLAB / 2, fl.slab.z + fl.slab.d / 2);
      slab.castShadow = true;
      slab.receiveShadow = true;
      fg.add(slab);

      // cap (roof of this storey where the next one is smaller)
      if (fl.index < layout.floors.length - 1) {
        const H = fl.height - SLAB;
        const cap = new THREE.Mesh(new THREE.BoxGeometry(fl.rect.w + 0.3, 0.2, fl.rect.d + 0.3), mats.slab);
        cap.position.set(fl.rect.x + fl.rect.w / 2, H + 0.1, fl.rect.z + fl.rect.d / 2);
        cap.castShadow = true;
        cap.receiveShadow = true;
        fg.add(cap);
        rt.cap = cap;
      }

      // rooms
      const ceil = fl.height - SLAB;
      const addRoom = (room: RoomLayout, matKey: "wood" | "marble" | "stone" | "concrete" | "deck", terrace: boolean) => {
        const cx = room.x + room.w / 2;
        const cz = room.z + room.d / 2;
        const geo = new THREE.PlaneGeometry(room.w, room.d);
        geo.rotateX(-Math.PI / 2);
        const uv = geo.attributes.uv as THREE.BufferAttribute;
        const tile = 2.8;
        for (let k = 0; k < uv.count; k++) uv.setXY(k, (uv.getX(k) * room.w) / tile, (uv.getY(k) * room.d) / tile);
        const floorMesh = new THREE.Mesh(geo, mats.floors[matKey]);
        floorMesh.position.set(cx, 0.008, cz);
        floorMesh.receiveShadow = true;
        floorMesh.userData.pick = { type: "room", id: room.id };
        fg.add(floorMesh);

        const ovMat = new THREE.MeshBasicMaterial({ color: "#e0b865", transparent: true, opacity: 0, depthWrite: false });
        const ov = new THREE.Mesh(new THREE.PlaneGeometry(room.w - 0.1, room.d - 0.1).rotateX(-Math.PI / 2), ovMat);
        ov.position.set(cx, 0.03, cz);
        ov.renderOrder = 3;
        ov.userData.pick = { type: "room", id: room.id };
        fg.add(ov);
        const rr: RoomRT = { layout: room, overlay: ov, mat: ovMat, alpha: 0, floor: fl.index };
        rt.rooms.push(rr);
        this.roomMap.set(room.id, rr);

        const fur = terrace ? furnishTerrace(room, this.layout.pool && this.layout.pool.floor === fl.index ? this.layout.pool : null, mats) : furnishRoom(room, ceil, mats);
        fur.group.position.set(cx, 0.01, cz);
        fg.add(fur.group);
        fur.objects.forEach((o, k) => {
          const id = `${room.id}-o${k}`;
          o.group.userData.objectId = id;
          this.objects.push({ info: { id, name: o.name, desc: o.desc, floor: fl.index, roomId: room.id, roomName: room.name }, group: o.group });
        });
      };
      for (const room of fl.rooms) addRoom(room, FLOOR_MAT[room.kind], false);
      if (fl.terraceRoom) addRoom(fl.terraceRoom, "deck", true);

      // walls
      fg.add(walls);
      for (const seg of fl.walls) this.buildWall(rt, fl, seg);

      // colliders
      for (const seg of fl.walls) {
        const vertical = seg.x1 === seg.x2;
        const thick = (seg.exterior ? WALL_EXT : WALL_INT) / 2 + 0.02;
        const a = vertical ? seg.z1 : seg.x1;
        const b = vertical ? seg.z2 : seg.x2;
        const gaps = seg.openings.filter((o) => PASSABLE.has(o.kind)).sort((p, q) => p.from - q.from);
        let cur = a - (seg.exterior ? thick : 0);
        const pushSeg = (s: number, e: number) => {
          if (e - s < 0.05) return;
          rt.colliders.push(vertical ? { minX: seg.x1 - thick, maxX: seg.x1 + thick, minZ: s, maxZ: e } : { minX: s, maxX: e, minZ: seg.z1 - thick, maxZ: seg.z1 + thick });
        };
        for (const o of gaps) {
          pushSeg(cur, o.from);
          cur = o.to;
        }
        pushSeg(cur, b + (seg.exterior ? thick : 0));
      }
      if (layout.pool && layout.pool.floor === fl.index) {
        const p = layout.pool;
        rt.colliders.push({ minX: p.x - 0.4, maxX: p.x + p.w + 0.4, minZ: p.z - 0.4, maxZ: p.z + p.d + 0.4 });
      }

      // balustrade around terraces
      const T = fl.terraceRoom;
      if ((layout.elevation > 3 || fl.index > g) && T && !underground) {
        const hh = 1.05;
        const gl = (w: number, d: number, x: number, z: number) => {
          const m = box(fg, w, hh, d, mats.glass, x, hh / 2, z);
          m.castShadow = false;
          m.userData.glass = true;
          box(fg, w + (w > d ? 0 : 0), 0.05, Math.max(d, 0.07), mats.metal, x, hh + 0.02, z).userData.glass = true;
        };
        gl(T.w, 0.04, T.x + T.w / 2, T.z + T.d - 0.1);
        gl(0.04, T.d, T.x + 0.1, T.z + T.d / 2);
        gl(0.04, T.d, T.x + T.w - 0.1, T.z + T.d / 2);
      }

      // porch + columns
      if (spec.columns && fl.index === g && T) {
        const pd = Math.min(4, T.d);
        const H = fl.height - SLAB;
        box(fg, T.w + 0.6, 0.32, pd + 0.3, mats.slab, T.x + T.w / 2, H - 0.14, T.z + pd / 2 + 0.1);
        const n = Math.max(3, Math.round((T.w - 2) / 3.3) + 1);
        for (let k = 0; k < n; k++) {
          const x = T.x + 1.2 + (k * (T.w - 2.4)) / (n - 1);
          const z = T.z + pd - 0.35;
          cyl(fg, 0.26, 0.28, H - 0.5, mats.wallExt, x, (H - 0.5) / 2 + 0.2, z, 18);
          box(fg, 0.7, 0.2, 0.7, mats.wallExt, x, 0.1, z);
          box(fg, 0.7, 0.2, 0.7, mats.wallExt, x, H - 0.4, z);
        }
      }

      this.building.add(fg);
      this.floors.push(rt);
    });

    this.buildRoof();
  }

  private buildRoof() {
    const { layout, spec, mats } = this;
    const top = layout.floors[layout.floors.length - 1];
    const r = top.rect;
    const H = top.height - SLAB;
    const roof = this.roof;
    roof.position.y = top.y;
    const cx = r.x + r.w / 2;
    const cz = r.z + r.d / 2;
    if (spec.roof === "flat") {
      const m = new THREE.Mesh(new THREE.BoxGeometry(r.w + 1.8, SLAB, r.d + 1.8), mats.roof);
      m.position.set(cx, H + SLAB / 2, cz);
      m.castShadow = true;
      m.receiveShadow = true;
      roof.add(m);
      box(roof, r.w * 0.2, 0.28, r.d * 0.22, mats.glass, cx - r.w * 0.2, H + SLAB + 0.14, cz).userData.glass = true;
      box(roof, r.w * 0.12, 0.6, r.d * 0.16, mats.dark, cx + r.w * 0.25, H + SLAB + 0.3, cz - r.d * 0.15);
    } else if (spec.roof === "gable") {
      const short = Math.min(r.w, r.d) + 2.6;
      const long = Math.max(r.w, r.d) + 2.6;
      const rise = short * 0.3;
      const m = new THREE.Mesh(gableGeometry(short, long, rise), mats.roof);
      if (r.w >= r.d) m.rotation.y = Math.PI / 2;
      m.position.set(cx, H - 0.05, cz);
      m.castShadow = true;
      m.receiveShadow = true;
      roof.add(m);
      box(roof, 1.3, rise + 2.2, 1.3, mats.stone, cx + r.w * 0.25, H + rise * 0.5 + 0.6, cz - 1);
    } else {
      const rise = Math.min(r.w, r.d) * 0.28;
      const geo = new THREE.CylinderGeometry(0.7071 * 0.16, 0.7071, 1, 4, 1);
      geo.rotateY(Math.PI / 4);
      const m = new THREE.Mesh(geo, mats.roof);
      m.scale.set(r.w + 1.8, rise, r.d + 1.8);
      m.position.set(cx, H + rise / 2 - 0.02, cz);
      m.castShadow = true;
      m.receiveShadow = true;
      roof.add(m);
      box(roof, 1.1, rise + 1.4, 1.1, mats.stone, cx + r.w * 0.28, H + rise * 0.4 + 0.4, cz + 1);
    }
    this.building.add(roof);
  }

  private buildWall(rt: FloorRT, fl: FloorLayout, seg: WallSeg) {
    const mats = this.mats;
    const vertical = seg.x1 === seg.x2;
    const thick = seg.exterior ? WALL_EXT : WALL_INT;
    const H = fl.height - SLAB;
    let a = vertical ? seg.z1 : seg.x1;
    let b = vertical ? seg.z2 : seg.x2;
    if (seg.exterior) {
      const r = fl.rect;
      if (vertical) {
        if (Math.abs(a - r.z) < 0.01) a -= thick / 2;
        if (Math.abs(b - (r.z + r.d)) < 0.01) b += thick / 2;
      } else {
        if (Math.abs(a - r.x) < 0.01) a -= thick / 2;
        if (Math.abs(b - (r.x + r.w)) < 0.01) b += thick / 2;
      }
    }
    const mid = (a + b) / 2;
    const wg = new THREE.Group();
    wg.position.set(vertical ? seg.x1 : mid, 0, vertical ? mid : seg.z1);
    if (vertical) wg.rotation.y = -Math.PI / 2;
    let outSign = 1;
    if (seg.exterior) {
      if (!vertical) outSign = seg.side === "n" ? -1 : 1;
      else outSign = seg.side === "e" ? -1 : 1;
    }
    const wallMat = seg.exterior ? mats.wallExt : mats.wallInt;

    const piece = (u0: number, u1: number, y0: number, y1: number) => {
      if (u1 - u0 < 0.01 || y1 - y0 < 0.01) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(u1 - u0, y1 - y0, thick), wallMat);
      m.position.set((u0 + u1) / 2 - mid, (y0 + y1) / 2, 0);
      m.castShadow = true;
      m.receiveShadow = true;
      wg.add(m);
    };
    const pane = (parent: THREE.Object3D, w: number, h: number, x: number, y: number, z = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.035), mats.glass);
      m.position.set(x, y, z);
      m.userData.glass = true;
      parent.add(m);
      return m;
    };
    const bar = (parent: THREE.Object3D, w: number, h: number, x: number, y: number, z = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), mats.frame);
      m.position.set(x, y, z);
      m.castShadow = false;
      m.userData.glass = true;
      parent.add(m);
    };
    const doorIdx = () => rt.doors.length;

    const ops = [...seg.openings].sort((p, q) => p.from - q.from);
    let cur = a;
    for (const o of ops) {
      const f = Math.max(o.from, a + 0.05);
      const t = Math.min(o.to, b - 0.05);
      if (t - f < 0.3) continue;
      piece(cur, f, 0, H);
      const head = Math.min(o.head, H);
      if (o.sill > 0) piece(f, t, 0, o.sill);
      if (head < H) piece(f, t, head, H);
      const w = t - f;
      const cu = (f + t) / 2 - mid;
      const ax = vertical ? seg.x1 : f;
      const az = vertical ? f : seg.z1;
      const bx = vertical ? seg.x1 : t;
      const bz = vertical ? t : seg.z1;

      if (o.kind === "window") {
        const h = head - o.sill;
        pane(wg, w, h, cu, o.sill + h / 2);
        bar(wg, w, 0.05, cu, o.sill + 0.025);
        bar(wg, w, 0.05, cu, head - 0.025);
        bar(wg, 0.05, h, cu - w / 2 + 0.025, o.sill + h / 2);
        bar(wg, 0.05, h, cu + w / 2 - 0.025, o.sill + h / 2);
        if (w > 1.2) bar(wg, 0.04, h, cu, o.sill + h / 2);
      } else if (o.kind === "slider") {
        const h = head - 0.04;
        bar(wg, w, 0.05, cu, 0.025);
        if (head >= H - 0.01) bar(wg, w, 0.05, cu, H - 0.025);
        bar(wg, 0.06, h, cu - w / 2 + 0.03, 0.04 + h / 2);
        bar(wg, 0.06, h, cu + w / 2 - 0.03, 0.04 + h / 2);
        const pw = w / 2;
        const mk = (px: number, z: number) => {
          const pg = new THREE.Group();
          pg.position.set(px, 0, z);
          pane(pg, pw - 0.05, h - 0.05, 0, 0.04 + h / 2);
          bar(pg, 0.05, h, -pw / 2 + 0.03, 0.04 + h / 2);
          bar(pg, 0.05, h, pw / 2 - 0.03, 0.04 + h / 2);
          wg.add(pg);
          return pg;
        };
        const pA = mk(cu - pw / 2, 0.05);
        mk(cu + pw / 2, -0.05);
        const baseA = pA.position.x;
        // the near panel slides across the fixed one, opening half of the span
        rt.doors.push({
          kind: "slider",
          t: 0,
          manual: false,
          ax,
          az,
          bx,
          bz,
          update: (k) => {
            pA.position.x = baseA + pw * 0.92 * k;
          },
        });
      } else if (o.kind === "door") {
        const swing = doorIdx() % 2 === 0 ? 1 : -1;
        const pivot = new THREE.Group();
        pivot.position.set(f - mid + 0.02, 0, 0);
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.05, 2.1, 0.05), mats.door);
        leaf.position.set((w - 0.05) / 2, 1.05, 0);
        leaf.castShadow = true;
        const idx = doorIdx();
        leaf.userData.pick = { type: "door", floor: fl.index, idx };
        pivot.add(leaf);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.12), mats.brass);
        handle.position.set(w - 0.15, 1.0, 0);
        handle.userData.pick = { type: "door", floor: fl.index, idx };
        pivot.add(handle);
        wg.add(pivot);
        bar(wg, w, 0.05, cu, head - 0.025);
        rt.doors.push({ kind: "door", t: 0, manual: false, ax, az, bx, bz, update: (k) => (pivot.rotation.y = swing * k * Math.PI * 0.5) });
      } else if (o.kind === "main") {
        const half = w / 2;
        const idx = doorIdx();
        const mkLeaf = (px: number, dirSign: number) => {
          const pivot = new THREE.Group();
          pivot.position.set(px, 0, 0);
          const leaf = new THREE.Mesh(new THREE.BoxGeometry(half - 0.03, 2.55, 0.07), mats.door);
          leaf.position.set(dirSign * (half / 2), 1.28, 0);
          leaf.castShadow = true;
          leaf.userData.pick = { type: "door", floor: fl.index, idx };
          pivot.add(leaf);
          const hb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 0.05), mats.brass);
          hb.position.set(dirSign * (half - 0.15), 1.1, 0.07 * outSign);
          hb.userData.pick = { type: "door", floor: fl.index, idx };
          pivot.add(hb);
          wg.add(pivot);
          return pivot;
        };
        const pl = mkLeaf(f - mid + 0.02, 1);
        const pr = mkLeaf(t - mid - 0.02, -1);
        rt.doors.push({
          kind: "main",
          t: 0,
          manual: false,
          ax,
          az,
          bx,
          bz,
          update: (k) => {
            pl.rotation.y = -outSign * k * Math.PI * 0.55;
            pr.rotation.y = outSign * k * Math.PI * 0.55;
          },
        });
        bar(wg, w, 0.06, cu, head - 0.03);
      } else if (o.kind === "garage") {
        const gp = new THREE.Group();
        gp.position.set(cu, head, 0);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(w, head, 0.08), mats.door);
        panel.position.y = -head / 2;
        panel.castShadow = true;
        gp.add(panel);
        for (let k = 1; k < 6; k++) {
          const g = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, 0.1), mats.dark);
          g.position.y = -(k * head) / 6;
          gp.add(g);
        }
        wg.add(gp);
        rt.doors.push({ kind: "garage", t: 0, manual: false, ax, az, bx, bz, update: (k) => (gp.scale.y = 1 - 0.93 * k) });
      }
      cur = t;
    }
    piece(cur, b, 0, H);
    rt.walls.add(wg);
  }

  // ------------------------------------------------------------------ labels
  private syncLabels() {
    const want = new Map<string, { text: string; sub?: string; kind: "chip" | "pin"; pos: () => THREE.Vector3; click?: () => void }>();
    const s = this.state;
    if (!this.opts.hero) {
      if (s.mode === "floor" && s.floor !== null) {
        const rt = this.floors[s.floor];
        for (const r of rt.rooms) {
          const l = r.layout;
          want.set(`room:${l.id}:floor`, {
            text: l.name,
            sub: `${Math.round(l.area)} m²`,
            kind: "chip",
            pos: () => rt.group.localToWorld(new THREE.Vector3(l.x + l.w / 2, 0.6, l.z + l.d / 2)),
            click: () => this.flyToRoom(l.id),
          });
        }
      } else if ((s.mode === "room" || s.mode === "walk") && s.roomId) {
        const r = this.roomMap.get(s.roomId);
        if (r && s.mode === "room") {
          const l = r.layout;
          const rt = this.floors[r.floor];
          want.set(`room:${l.id}:room`, {
            text: l.name,
            sub: `${l.w.toFixed(1)} × ${l.d.toFixed(1)} m`,
            kind: "chip",
            pos: () => rt.group.localToWorld(new THREE.Vector3(l.x + l.w / 2, 2.2, l.z + l.d / 2)),
          });
        }
        for (const o of this.objects) {
          if (o.info.roomId !== s.roomId || o.info.id === s.objectId) continue;
          want.set(`obj:${o.info.id}`, {
            text: o.info.name,
            kind: "pin",
            pos: () => {
              const bb = new THREE.Box3().setFromObject(o.group);
              const c = bb.getCenter(new THREE.Vector3());
              c.y = bb.max.y + 0.15;
              return c;
            },
            click: () => this.flyToObject(o.info.id),
          });
        }
      }
    }
    for (const [k, l] of this.labels) {
      if (!want.has(k)) {
        l.el.remove();
        this.labels.delete(k);
      }
    }
    for (const [k, w] of want) {
      if (this.labels.has(k)) continue;
      const el = document.createElement("button");
      el.type = "button";
      el.className = w.kind === "pin" ? "vpin" : "vchip";
      el.setAttribute("aria-label", w.kind === "pin" ? `Inspect ${w.text}` : `${w.text}${w.sub ? `, ${w.sub}` : ""}`);
      if (w.kind === "pin") {
        el.innerHTML = `<span class="vpin-dot"></span><span class="vpin-text">${w.text}</span>`;
      } else {
        el.innerHTML = `<span class="vchip-name">${w.text}</span>${w.sub ? `<span class="vchip-sub">${w.sub}</span>` : ""}`;
      }
      if (w.click) el.addEventListener("click", w.click);
      else el.tabIndex = -1;
      if (!w.click) el.style.pointerEvents = "none";
      this.overlay.appendChild(el);
      this.labels.set(k, { el, pos: w.pos });
    }
  }

  private updateLabels() {
    if (!this.labels.size) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    for (const l of this.labels.values()) {
      const v = l.pos().project(this.camera);
      if (v.z > 1 || v.z < -1 || Math.abs(v.x) > 1.15 || Math.abs(v.y) > 1.15) {
        l.el.style.display = "none";
        continue;
      }
      l.el.style.display = "";
      l.el.style.transform = `translate3d(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px, 0) translate(-50%, -50%)`;
    }
  }

  // ------------------------------------------------------------------ picking
  private raycast(ev: { clientX: number; clientY: number }): Pick | null {
    if (!this.floors.length) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const targets = this.floors.filter((f) => f.group.visible).map((f) => f.group);
    const hits = ray.intersectObjects(targets, true);
    const exterior = this.state.mode === "exterior";
    for (const h of hits) {
      if (h.object.userData.glass || !h.object.visible) continue;
      let o: THREE.Object3D | null = h.object;
      let floorIdx = -1;
      let pick: Pick | null = null;
      while (o) {
        if (!pick && o.userData.pick) {
          const p = o.userData.pick as Pick;
          pick = p;
        }
        if (!pick && o.userData.objectId) pick = { type: "object", id: o.userData.objectId as string };
        if (o.userData.floorIndex !== undefined) floorIdx = o.userData.floorIndex as number;
        o = o.parent;
      }
      if (exterior) return floorIdx >= 0 ? { type: "floor", floor: floorIdx } : null;
      if (pick) return pick;
      return null; // blocked by wall / slab
    }
    return null;
  }

  private onDown = (e: PointerEvent) => {
    this.downPos = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (this.state.mode === "walk") {
      this.walk.dragging = true;
      this.lookLast = { x: e.clientX, y: e.clientY };
      this.renderer.domElement.setPointerCapture(e.pointerId);
      this.container.focus({ preventScroll: true });
    }
  };

  private onMove = (e: PointerEvent) => {
    if (this.state.mode === "walk" && this.walk.dragging && this.walk.active) {
      const dx = e.clientX - this.lookLast.x;
      const dy = e.clientY - this.lookLast.y;
      this.lookLast = { x: e.clientX, y: e.clientY };
      this.walk.yaw -= dx * 0.0042;
      this.walk.pitch = Math.max(-1.2, Math.min(1.2, this.walk.pitch - dy * 0.0042));
      return;
    }
    if (e.pointerType !== "mouse" || this.opts.hero) return;
    const now = performance.now();
    if (now - this.lastHover < 70 || e.buttons) return;
    this.lastHover = now;
    const hit = this.raycast(e);
    this.renderer.domElement.style.cursor = hit ? "pointer" : this.state.mode === "walk" ? "grab" : "default";
    this.hoverRoom = hit && hit.type === "room" && this.state.mode !== "exterior" ? hit.id : null;
  };

  private onUp = (e: PointerEvent) => {
    this.walk.dragging = false;
    if (this.opts.hero) return;
    const moved = Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y);
    if (moved > 6 || performance.now() - this.downPos.t > 500 || this.state.flying) return;
    const hit = this.raycast(e);
    const mode = this.state.mode;
    if (!hit) {
      if (mode !== "exterior" && this.state.objectId) this.selectObject(null);
      return;
    }
    switch (hit.type) {
      case "floor":
        this.focusFloor(hit.floor);
        break;
      case "room":
        if (mode === "walk") break;
        if (hit.id !== this.state.roomId) this.flyToRoom(hit.id);
        else if (this.state.objectId) this.selectObject(null);
        break;
      case "object":
        this.flyToObject(hit.id, mode !== "walk");
        break;
      case "door": {
        const d = this.floors[hit.floor]?.doors[hit.idx];
        if (d) d.manual = d.t < 0.5;
        break;
      }
    }
  };

  private onLeave = () => {
    this.hoverRoom = null;
    this.walk.dragging = false;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.state.mode !== "walk") return;
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", "q", "e"].includes(k)) {
      this.walk.keys.add(k);
      e.preventDefault();
    }
    if (k === "escape") this.exitWalk();
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.walk.keys.delete(e.key.toLowerCase());
  };
  private onBlur = () => {
    this.walk.keys.clear();
  };

  // ------------------------------------------------------------------ frame loop
  private frame = (now: number) => {
    if (!this.running || this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.clock += dt;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private stepTime(k: number, dt: number) {
    const t = TIMES[this.state.time];
    const c = this.cur;
    c.skyTop.lerp(this.tmpC.set(t.skyTop), k);
    c.skyBot.lerp(this.tmpC.set(t.skyBot), k);
    c.sun.lerp(this.tmpC.set(t.sun), k);
    c.hemiSky.lerp(this.tmpC.set(t.hemiSky), k);
    c.hemiGround.lerp(this.tmpC.set(t.hemiGround), k);
    c.fog.lerp(this.tmpC.set(t.fog), k);
    c.sunDir.lerp(this.tmpV.set(...t.sunPos).normalize(), k).normalize();
    c.sunI += (t.sunI - c.sunI) * k;
    c.hemiI += (t.hemiI - c.hemiI) * k;
    c.env += (t.env - c.env) * k;
    c.exposure += (t.exposure - c.exposure) * k;
    c.glow += (t.glow - c.glow) * k;
    c.star += (t.star - c.star) * k;

    const m = this.metrics();
    this.sun.color.copy(c.sun);
    this.sun.intensity = c.sunI;
    this.sun.position.set(m.cx, this.layout.elevation + 5, m.cz).addScaledVector(c.sunDir, 280);
    this.sun.target.position.set(m.cx, this.layout.elevation + 4, m.cz);
    this.hemi.color.copy(c.hemiSky);
    this.hemi.groundColor.copy(c.hemiGround);
    this.hemi.intensity = c.hemiI;
    this.scene.environmentIntensity = c.env;
    this.renderer.toneMappingExposure = c.exposure;
    (this.skyMat.uniforms.top.value as THREE.Color).copy(c.skyTop);
    (this.skyMat.uniforms.bot.value as THREE.Color).copy(c.skyBot);
    (this.skyMat.uniforms.sunDir.value as THREE.Vector3).copy(c.sunDir);
    (this.skyMat.uniforms.sunCol.value as THREE.Color).copy(c.sun).multiplyScalar(0.55);
    (this.stars.material as THREE.PointsMaterial).opacity = c.star;
    if (this.scene.fog) (this.scene.fog as THREE.Fog).color.copy(c.fog);
    this.mats.setGlow(c.glow);
    this.env?.update(dt, c.glow);
  }

  private update(dt: number) {
    if (!this.floors.length) return;
    const s = this.state;
    const g = this.layout.groundIndex;
    const hero = !!this.opts.hero;

    this.stepTime(1 - Math.exp(-dt * 2.2), dt);
    this.sky.position.copy(this.camera.position);
    this.stars.position.copy(this.camera.position);

    // explode / roof lift
    this.explodeCur = damp(this.explodeCur, this.explodeT, 4, dt);
    this.liftCur = damp(this.liftCur, s.roofLifted ? 1 : 0, 3.2, dt);
    const n = this.floors.length;
    const lift = Math.max(10, this.metrics().H * 0.9);
    for (const rt of this.floors) {
      rt.group.position.y = rt.fl.y + (rt.index - g) * GAP * this.explodeCur;
    }
    this.roof.position.y = this.floors[n - 1].fl.y + (n - g) * GAP * this.explodeCur + this.liftCur * lift;

    // visibility
    const focus = s.mode === "floor" && s.floor !== null ? s.floor : null;
    for (const rt of this.floors) {
      let vis = !this.hidden.has(rt.index);
      if (focus !== null) vis = vis && (s.isolate ? rt.index === focus : rt.index <= focus);
      rt.group.visible = vis;
      const cutTarget = focus === rt.index ? 0.2 : 1;
      rt.wallScale = damp(rt.wallScale, cutTarget, 6, dt);
      rt.walls.scale.y = rt.wallScale;
      if (rt.cap) rt.cap.visible = focus !== rt.index;
    }
    this.roof.visible = focus === null && !this.hidden.has(n - 1);

    // x-ray + terrain
    this.xrayCur = damp(this.xrayCur, s.xray ? 1 : 0, 5, dt);
    const ext = 1 - this.xrayCur * 0.88;
    const mats = this.mats;
    mats.wallExt.opacity = ext;
    mats.wallInt.opacity = 1 - this.xrayCur * 0.6;
    mats.wallExt.transparent = ext < 0.995;
    mats.wallInt.transparent = this.xrayCur > 0.005;
    mats.wallExt.depthWrite = ext > 0.6;
    mats.wallInt.depthWrite = this.xrayCur < 0.4;
    let tTarget = 1;
    const belowGround = s.floor !== null && s.floor < g && s.mode !== "exterior";
    if (this.explodeCur > 0.04 || belowGround || this.hidden.has(g)) tTarget = 0.07;
    else if (s.xray) tTarget = 0.55;
    if (this.layout.elevation > 3) tTarget = 1;
    this.terrainCur = damp(this.terrainCur, tTarget, 4, dt);
    if (this.env) {
      for (const f of this.env.fade) {
        f.opacity = this.terrainCur;
        f.depthWrite = this.terrainCur > 0.6;
      }
    }

    // doors
    const near = new THREE.Vector2();
    for (const rt of this.floors) {
      const walking = s.mode === "walk" && this.walk.floor === rt.index;
      for (const d of rt.doors) {
        let target = d.manual ? 1 : 0;
        if (s.facadeOpen && (d.kind === "slider" || d.kind === "main" || d.kind === "garage")) target = 1;
        if (walking) {
          const dx = this.walk.x - Math.min(Math.max(this.walk.x, Math.min(d.ax, d.bx)), Math.max(d.ax, d.bx));
          const dz = this.walk.z - Math.min(Math.max(this.walk.z, Math.min(d.az, d.bz)), Math.max(d.az, d.bz));
          near.set(dx, dz);
          if (near.length() < (d.kind === "door" ? 1.7 : 2.4)) target = 1;
        }
        d.t = damp(d.t, target, 5, dt);
        if (Math.abs(d.t - target) < 0.002) d.t = target;
        d.update(d.t);
      }
    }

    // room highlight
    for (const r of this.roomMap.values()) {
      let target = 0;
      if (r.layout.id === this.hoverRoom || r.layout.id === this.sideHover) target = 0.3;
      else if (s.mode === "floor" && r.layout.id === s.roomId) target = 0.3;
      r.alpha = damp(r.alpha, target, 10, dt);
      r.mat.opacity = r.alpha;
      r.overlay.visible = r.alpha > 0.004;
    }

    // object highlight
    if (s.objectId && !hero) {
      const o = this.objects.find((x) => x.info.id === s.objectId);
      if (o) {
        const bb = new THREE.Box3().setFromObject(o.group);
        const size = bb.getSize(new THREE.Vector3());
        this.highlight.position.copy(bb.getCenter(new THREE.Vector3()));
        this.highlight.scale.set(size.x + 0.12, size.y + 0.12, size.z + 0.12);
        (this.highlight.material as THREE.LineBasicMaterial).opacity = 0.55 + 0.4 * Math.sin(this.clock * 4);
      }
    }

    // headlamp for interiors
    const inside = s.mode === "room" || s.mode === "walk";
    const lampTarget = inside ? 1.5 + this.cur.glow * 15 : 0;
    this.headlamp.intensity = damp(this.headlamp.intensity, lampTarget, 3, dt);

    // camera
    if (hero) {
      const p = this.extPose(false);
      const a = this.clock * 0.07 + 0.6;
      const r = p.R * 1.55 * Math.min(1.7, Math.max(1, 0.8 / this.camera.aspect));
      this.camera.position.set(p.tgt.x + Math.sin(a) * r, p.tgt.y + r * 0.2 + Math.sin(this.clock * 0.2) * 1.2, p.tgt.z + Math.cos(a) * r);
      this.camera.lookAt(p.tgt);
    } else if (this.tween) {
      const tw = this.tween;
      tw.e += dt;
      const k = Math.min(1, tw.e / tw.dur);
      const e = easeInOut(k);
      this.camera.position.lerpVectors(tw.p0, tw.p1, e);
      this.controls.target.lerpVectors(tw.t0, tw.t1, e);
      const dist = tw.p0.distanceTo(tw.p1);
      this.camera.position.y += Math.sin(Math.PI * e) * Math.min(6, dist * 0.06);
      this.controls.update();
      if (k >= 1) {
        const done = tw.done;
        this.tween = null;
        s.flying = false;
        if (s.mode !== "walk") this.controls.enabled = true;
        done?.();
        this.emit();
      }
    } else if (s.mode === "walk" && this.walk.active) {
      this.stepWalk(dt);
    } else if (s.mode === "walk") {
      // flying into walk mode – orientation handled by controls.update during tween
    } else {
      this.followExplode(s.mode === "exterior");
      this.controls.update();
      if (s.mode === "room" && s.floor !== null) this.clampInside(s.floor);
    }

    if (this.tween || s.mode !== "exterior") this.followExplode(false);
    this.updateLabels();
  }

  /** keeps the whole exploded stack framed by panning up and dollying back as floors separate */
  private followExplode(apply: boolean) {
    const n = this.floors.length;
    const mean = ((n - 1) / 2 - this.layout.groundIndex) * GAP * this.explodeCur;
    const fac = 1 + 0.55 * this.explodeCur;
    if (apply && (Math.abs(mean - this.lastMean) > 1e-4 || Math.abs(fac - this.lastFac) > 1e-4)) {
      const off = this.camera.position.clone().sub(this.controls.target).multiplyScalar(fac / this.lastFac);
      this.controls.target.y += mean - this.lastMean;
      this.camera.position.copy(this.controls.target).add(off);
    }
    this.lastMean = mean;
    this.lastFac = fac;
  }

  private clampInside(i: number) {
    const rt = this.floors[i];
    const p = this.camera.position;
    const fy = this.floorWorldY(i);
    p.x = Math.min(Math.max(p.x, rt.bounds.minX), rt.bounds.maxX);
    p.z = Math.min(Math.max(p.z, rt.bounds.minZ), rt.bounds.maxZ);
    p.y = Math.min(Math.max(p.y, fy + 0.35), fy + rt.fl.height - SLAB - 0.25);
  }

  private stepWalk(dt: number) {
    const w = this.walk;
    const rt = this.floors[w.floor];
    let f = w.vf;
    let s = w.vs;
    const k = w.keys;
    if (k.has("w") || k.has("arrowup")) f += 1;
    if (k.has("s") || k.has("arrowdown")) f -= 1;
    if (k.has("d")) s += 1;
    if (k.has("a")) s -= 1;
    if (k.has("arrowleft") || k.has("q")) w.yaw += dt * 1.8;
    if (k.has("arrowright") || k.has("e")) w.yaw -= dt * 1.8;
    const len = Math.hypot(f, s);
    if (len > 1) {
      f /= len;
      s /= len;
    }
    const speed = k.has("shift") ? 5 : 2.5;
    const fx = -Math.sin(w.yaw);
    const fz = -Math.cos(w.yaw);
    const rx = Math.cos(w.yaw);
    const rz = -Math.sin(w.yaw);
    const dx = (fx * f + rx * s) * speed * dt;
    const dz = (fz * f + rz * s) * speed * dt;
    const R = 0.3;
    const hit = (x: number, z: number) => rt.colliders.some((b) => x > b.minX - R && x < b.maxX + R && z > b.minZ - R && z < b.maxZ + R);
    if (dx !== 0 && !hit(w.x + dx, w.z)) w.x += dx;
    if (dz !== 0 && !hit(w.x, w.z + dz)) w.z += dz;
    w.x = Math.min(Math.max(w.x, rt.bounds.minX), rt.bounds.maxX);
    w.z = Math.min(Math.max(w.z, rt.bounds.minZ), rt.bounds.maxZ);
    const moving = len > 0.05;
    if (moving) w.bob += dt * speed * 3.2;
    const targetY = this.floorWorldY(w.floor) + EYE + (moving ? Math.sin(w.bob) * 0.025 : 0);
    w.y = damp(w.y, targetY, 8, dt);
    this.camera.position.set(w.x, w.y, w.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.set(w.pitch, w.yaw, 0);

    // current room
    const here = rt.rooms.find((r) => w.x >= r.layout.x && w.x <= r.layout.x + r.layout.w && w.z >= r.layout.z && w.z <= r.layout.z + r.layout.d);
    if (here && here.layout.id !== this.state.roomId) {
      this.state.roomId = here.layout.id;
      this.syncLabels();
      this.emit();
    }
  }
}
