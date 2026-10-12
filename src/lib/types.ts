export type RoomKind =
  | "living"
  | "kitchen"
  | "dining"
  | "bedroom"
  | "master"
  | "bath"
  | "entry"
  | "library"
  | "cinema"
  | "spa"
  | "gym"
  | "wine"
  | "garage"
  | "office"
  | "lounge"
  | "gallery"
  | "kids"
  | "pool"
  | "staff"
  | "terrace";

export type ModelStyle = "modern" | "tower" | "chalet" | "palazzo" | "island" | "minimal" | "desert";
export type Setting = "ocean" | "island" | "lake" | "snow" | "skyline" | "urban" | "desert" | "riviera";
export type RoofKind = "flat" | "gable" | "hip";

export interface RoomSpec {
  kind: RoomKind;
  name: string;
  weight?: number;
}

export interface FloorSpec {
  name: string;
  height: number;
  /** footprint scale relative to ModelSpec width/depth */
  scale?: [number, number];
  /** footprint offset (x, z) from building centre in metres */
  offset?: [number, number];
  /** depth in metres of an open terrace on the south side */
  terrace?: number;
  rooms: RoomSpec[];
}

export interface Palette {
  wall: string;
  accent: string;
  floor: string;
  roof: string;
  glass: string;
  ground: string;
}

export interface ModelSpec {
  style: ModelStyle;
  setting: Setting;
  width: number;
  depth: number;
  seed: number;
  groundIndex: number;
  roof: RoofKind;
  /** distance above the terrain in metres (towers) */
  elevation?: number;
  pool?: { w: number; d: number; floor?: number; dx?: number } | null;
  columns?: boolean;
  palette: Palette;
  floors: FloorSpec[];
}

export interface PropertyFacts {
  appreciation5y: number;
  holdingCostPct: number;
  liquidity: "Exceptional" | "High" | "Selective";
  nearby: { label: string; detail: string }[];
}

export interface Property {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  city: string;
  region: string;
  country: string;
  continent: string;
  lat: number;
  lng: number;
  price: number;
  type: string;
  beds: number;
  baths: number;
  sqft: number;
  lotAcres: number;
  yearBuilt: number;
  architect: string;
  image: string;
  description: string;
  highlights: string[];
  amenities: string[];
  facts: PropertyFacts;
  model: ModelSpec;
  offMarket: boolean;
}

/** What a non-member is allowed to see about an off-market asset. */
export interface Teaser {
  id: number;
  region: string;
  type: string;
  beds: number;
  priceBand: string;
}
