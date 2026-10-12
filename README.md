# Atrium — Private Estates, Experienced in 3D

Atrium is the private digital gallery for **$10M+ residences**. Prospective buyers
step inside interactive 3D models, study generated floor plans, explore live maps,
and unlock off-market estates through a code-gated **Private Office** — before they
ever board a plane.

![Atrium](public/images/aurelia.jpg)

## ✨ Features

- **Interactive 3D viewer** — walk through procedurally generated residences (Three.js)
- **Generated floor plans** — every room laid out from the model spec, with areas and counts
- **Live map** — property locations on an interactive Leaflet map
- **Private Office** — code-gated access to off-market estates, HMAC-signed httpOnly
  sessions, rate-limited access-code attempts
- **Enquiry & access-request forms** — validated server-side and stored in PostgreSQL
- **Conversion-focused landing** — hero, social proof, features, collection, studio,
  audiences, testimonials, pricing, FAQ, final CTA and footer
- **Production-ready** — TypeScript strict, ESLint, security headers, health check,
  graceful seed-data fallback, SEO metadata + JSON-LD

## 🧰 Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · Cormorant Garamond + Inter (self-hosted via `@fontsource`) |
| Database | PostgreSQL · Drizzle ORM (`drizzle-orm` + `pg`) |
| 3D / Map | Three.js · Leaflet |
| Tooling | ESLint · drizzle-kit |

## 🚀 Getting started

### 1. Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database (local Docker, [Neon](https://neon.tech), [Supabase](https://supabase.com), or Vercel Postgres)

### 2. Install & configure

```bash
npm install
cp .env.example .env.local   # then edit the values
```

### 3. Set up the database

```bash
npm run db:push      # apply the schema (drizzle-kit push)
```

The `properties` table is seeded automatically on first load with three showcase
residences (Aurelia, Sky Residence, and more). Enquiries and access requests are
written to their own tables.

### 4. Run

```bash
npm run dev          # http://localhost:3000
```

## 🔧 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run db:generate` | Generate a migration from the schema |
| `npm run db:push` | Push the schema to the database (dev) |
| `npm run db:studio` | Open Drizzle Studio |

## 🔐 Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes (runtime) | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/db?sslmode=require` |
| `PRIVATE_OFFICE_SECRET` | **Yes (production)** | Secret used to sign Private Office sessions. Generate with `openssl rand -base64 32`. The app refuses to boot in production with the built-in default. |
| `PRIVATE_OFFICE_CODE` | Recommended | Access code for the Private Office. Defaults to a demo value (`ATRIUM-2026`) — set a unique code in production. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public base URL, e.g. `https://atrium.example.com` (used for SEO metadata) |

> The build never fails on missing variables: without `DATABASE_URL` the landing
> page renders from built-in seed data (enquiries, access requests and
> `/api/health` stay unavailable until it is set), and `PRIVATE_OFFICE_SECRET`
> must be set in production or Private Office sessions are refused.

## 🗄️ Data model

- **`properties`** — residences: name, tagline, location + geo coords, price, specs,
  description, highlights, amenities, facts, the 3D `model` spec, `off_market` flag
- **`enquiries`** — viewing / consultation / information / acquisition requests
- **`access_requests`** — Private Office applications (role, budget, regions, status)

## 🌐 Deployment (Vercel)

1. Push this repository to GitHub.
2. In Vercel: **Add New → Project → Import** the repository (framework: Next.js —
   auto-detected; defaults are correct).
3. Provision a database (Vercel Postgres / Neon / Supabase) and set the
   environment variables from the table above.
4. Deploy. Every push to the default branch creates a production deployment.

The site renders fully even before the database is reachable (it falls back to
the built-in showcase residences); enquiry and access-request forms require a
working `DATABASE_URL`.

## 🧪 Health check

```bash
curl https://your-domain.com/api/health
# {"ok":true}
```

## 📁 Project structure

```
src/
  app/            # Next.js App Router pages + API routes (health, enquiries, access-requests, private-office)
  components/     # Landing sections, 3D viewer, floor plan, map, private office UI
  db/             # Drizzle client + schema (properties, enquiries, access_requests)
  lib/            # Domain logic: properties, seed data, 3D layout engine, auth, formatting, FAQ
drizzle.config.json
```

## 📝 License

[MIT](LICENSE) © 2026 Abdulbasit Abdulalim
