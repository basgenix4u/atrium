import { asc } from "drizzle-orm";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { buildSeed } from "./seed-data";
import { priceBand } from "./format";
import type { Property, Teaser } from "./types";

type Row = typeof properties.$inferSelect;

function fromRow(r: Row): Property {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    city: r.city,
    region: r.region,
    country: r.country,
    continent: r.continent,
    lat: r.lat,
    lng: r.lng,
    price: r.price,
    type: r.type,
    beds: r.beds,
    baths: r.baths,
    sqft: r.sqft,
    lotAcres: r.lotAcres,
    yearBuilt: r.yearBuilt,
    architect: r.architect,
    image: r.image,
    description: r.description,
    highlights: r.highlights,
    amenities: r.amenities,
    facts: r.facts,
    model: r.model,
    offMarket: r.offMarket,
  };
}

function fallback(): Property[] {
  return buildSeed().map((p, i) => ({ ...p, id: i + 1 }));
}

/** Loads every property (public and off-market). Seeds the table on first use. */
export async function loadAllProperties(): Promise<Property[]> {
  try {
    let rows = await db.select().from(properties).orderBy(asc(properties.sortOrder), asc(properties.id));
    if (rows.length === 0) {
      const seed = buildSeed().map((p, i) => ({ ...p, sortOrder: i }));
      await db.insert(properties).values(seed).onConflictDoNothing();
      rows = await db.select().from(properties).orderBy(asc(properties.sortOrder), asc(properties.id));
    }
    return rows.map(fromRow);
  } catch {
    return fallback();
  }
}

export function splitProperties(all: Property[]) {
  const pub = all.filter((p) => !p.offMarket);
  const priv = all.filter((p) => p.offMarket);
  const teasers: Teaser[] = priv.map((p) => ({
    id: p.id,
    region: p.continent,
    type: p.type,
    beds: p.beds,
    priceBand: priceBand(p.price),
  }));
  return { pub, priv, teasers };
}
