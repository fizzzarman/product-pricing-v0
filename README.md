# DaamKoto — Bangladesh Hardware Price & Stock Aggregator

Compare computer and electronics hardware prices, stock, and specs across Bangladesh's
computer retailers. "DaamKoto" (দাম কত) means "how much" in Bengali.

> **Placeholder branding.** The name, logo, and color palette here are a sensible
> starting point, not a final decision — rename freely (see [Renaming](#renaming)).

## Status

This is under active build-out, following the phased plan below. Phase 1 (foundation) is
complete; later phases are in progress.

- [x] **Phase 1** — Next.js + Tailwind + Prisma schema + mock adapters + seed data
- [x] **Phase 2** — Homepage, search, category pages, product pages, price comparison, price history, compare
- [x] **Phase 3** — Admin dashboard (products, listings, retailers, data collection)
- [x] **Phase 4** — SEO (metadata, JSON-LD, sitemap/robots), ISR caching
- [~] **Phase 5** — Live scraping of Star Tech, Ryans and Dazzle (config presets + category crawl + product-page enrichment; selectors need verifying against the live sites — see [Live retailers](#live-retailers-star-tech-ryans-dazzle))
- [ ] **Phase 6** — Production deployment hardening, rate limiting, Sentry/analytics wiring

### Known gaps / not yet built

- Admin "merge duplicate products" and "relink listing to a different product" UI (schema and
  `matchingStatus`/`matchConfidence` support this; the interaction hasn't been built)
- User accounts, price alerts, and watchlists are schema-only (spec §24) — no UI/notifications
- Integration and E2E tests (unit tests for pricing/matching logic exist — see [Testing](#testing))
- Product image galleries: only the primary image is stored (the schema has one `imageUrl`)
- Listings that disappear from a retailer's site are not marked as delisted yet

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript + React
- **UI:** Tailwind CSS v4 + hand-built shadcn-style primitives (see [Note on shadcn/ui](#note-on-shadcnui)) + Lucide icons
- **Database:** PostgreSQL via [Supabase](https://supabase.com), accessed through Prisma ORM
- **Deployment:** Vercel (serverless functions + Vercel Cron)

## Project structure

```
src/
  app/                # Routes (App Router): homepage, search, products, categories,
                       # retailers, compare, admin, api/*
  components/
    ui/                # Design-system primitives (button, card, badge, table, ...)
    products/ search/ comparison/ retailers/ layout/ admin/
  lib/
    db/                # Prisma client singleton
    pricing/           # BDT formatting, lowest-price business logic, freshness
    products/          # slug/normalize/match pipeline, category tree
    search/ retailers/ validation/ i18n/
  adapters/
    base/              # RetailerAdapter interface
    mock/              # Deterministic mock adapter + seed catalog (used until real adapters land)
    scraper/           # Config-driven HTML scraper + presets for Star Tech / Ryans / Dazzle
    startech/ ryans/ techland/   # Placeholder real adapters (throw "not implemented")
    registry.ts        # Maps an adapterKey -> concrete adapter instance
  types/                # Shared domain types
prisma/
  schema.prisma
  seed.ts
```

Adding a 6th (or 50th) retailer means: write a new folder under `adapters/`, register it in
`adapters/registry.ts`, add a `DataSource` + `Retailer` row. No page or component changes
required — see `adapters/base/types.ts` for the contract every adapter implements.

## Local development

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a region close to
   Bangladesh (e.g. Singapore) for lower latency.
2. Wait for provisioning, then open **Project Settings → Database → Connection string**.
3. Copy the **pooled** connection string (port `6543`, "Transaction" mode) into
   `DATABASE_URL`, and the **direct** connection string (port `5432`) into `DIRECT_URL`.
4. Nothing extra needs to be run manually in the SQL editor — `prisma migrate dev` enables
   the `pg_trgm`/`unaccent` extensions declared in `schema.prisma` automatically.

### 2. Configure environment variables

```bash
cp .env.example .env
# then fill in DATABASE_URL, DIRECT_URL, ADMIN_SECRET, CRON_SECRET
```

### 3. Install, migrate, seed, run

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

This seeds ~25 realistic products (GPUs, CPUs, RAM, SSDs, laptops, monitors, keyboards,
mice, and more) across 5 mock Bangladeshi retailers (Star Tech, Ryans, TechLand BD, UCC,
Computer Source), each with its own price, stock status, and ~30 days of price history.

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Script               | Purpose                                    |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Start the dev server                        |
| `npm run build`      | Production build                            |
| `npm run db:migrate` | Create/apply a migration in dev             |
| `npm run db:deploy`  | Apply migrations in production (CI/Vercel)  |
| `npm run db:studio`  | Open Prisma Studio to browse the DB         |
| `npm run seed`       | Re-run the mock data seed                   |
| `npm run seed:live`  | Register Star Tech / Ryans / Dazzle as live scraped retailers |
| `npm run scrape:check -- <startech\|ryans\|dazzle>` | Dry-run a retailer's selectors against the live site (no DB) |
| `npm run sync [-- <retailer-slug>]` | Run a full sync from the CLI with no serverless time limit |

## Testing

Unit tests cover the business logic that doesn't depend on a live database — currency
formatting, the lowest-listed-vs-lowest-available price rule (spec §38), staleness
thresholds (spec §39), and the title normalization/matching pipeline (spec §27):

```bash
npm test
```

Integration tests (search, listing retrieval, retailer adapters against a real database) and
E2E tests (search → product → compare → retailer click) are not yet implemented — see
[Known gaps](#known-gaps--not-yet-built).

## Scheduled sync (real retailer scraping)

Beyond the mock adapters, the app can sync real retailers on a schedule (every 2–3 hours,
or whatever cadence you configure) via a generic, **config-driven** scraper:

- `src/adapters/scraper/scraperAdapter.ts` — a single `ScraperAdapter` class that implements
  the same `RetailerAdapter` interface as the mock adapters. Its behavior (search URL, CSS
  selectors, stock-text keywords, rate limit) comes entirely from a `DataSource.config` JSON
  blob in the database — **onboarding retailer #6–#50 is a database row, not a code
  change**, as long as the site server-renders its catalog HTML.
- `src/lib/retailers/robots.ts` — checks `robots.txt` (and honors `Crawl-delay`) before every
  fetch, per the project's legal/technical requirement. A site that disallows the path is
  skipped, not scraped anyway.
- `src/lib/retailers/sync.ts` — the ingestion pipeline: runs the adapter's `searchProducts`
  over the retailer's configured seed queries, runs each result through the matching
  pipeline (`lib/products/match.ts`), upserts a `ProductListing` + a `PriceHistory` point,
  and recomputes the product's price summary. One bad listing or one failed query never
  aborts the rest of the run (errors are collected into the `ScraperRun` row instead).
- `src/app/api/cron/sync-all/route.ts` — the endpoint the scheduler calls. It fans out to
  every active retailer with `Promise.allSettled`, so **one retailer's site being down never
  blocks the other 14**.

### Triggering it

`vercel.json` registers a native Vercel Cron job at `0 */3 * * *` (every 3 hours). **This
requires Vercel Pro** — Hobby's cron only supports once-per-day schedules. If you're staying
on Hobby, delete the `crons` block from `vercel.json` and instead point any external
scheduler (GitHub Actions on a `schedule:` trigger, [cron-job.org](https://cron-job.org),
etc.) at:

```
GET https://<your-domain>/api/cron/sync-all
Authorization: Bearer <CRON_SECRET>
```

— the endpoint itself doesn't care who calls it, only that the bearer token matches
`CRON_SECRET`. You can also trigger a single retailer on demand from **Admin → Retailers →
Sync now**, which calls `POST /api/admin/sync/:retailerSlug`.

### Adding a real retailer

1. Confirm the legal/technical basis first (official API/feed preferred; otherwise check
   `robots.txt` and Terms of Service — see spec §6/§7 in the original brief).
2. Create a `Retailer` + `DataSource` row (via Prisma Studio, a script, or a future admin
   "Add retailer" form) with `DataSource.type = "PERMITTED_SCRAPE"` and a config shaped like:

   ```jsonc
   {
     "searchUrlTemplate": "https://example-retailer.com.bd/search?q={query}",
     "searchSelectors": {
       "item": ".product-card",
       "title": ".product-card__title",
       "price": ".product-card__price",
       "url": "a.product-card__link",
       "image": "img.product-card__image",
       "availabilityText": ".product-card__stock"
     },
     "minRequestIntervalMs": 1500,
     "seedQueries": [
       { "query": "RTX 5070", "categorySlug": "gpu" },
       { "query": "Ryzen 7", "categorySlug": "cpu" }
       // one entry per product line/category you want this retailer crawled for
     ]
   }
   ```

3. That's it — the next scheduled (or manually triggered) sync picks it up automatically.

### Scope limit

`ScraperAdapter` does plain `fetch` + HTML parsing (via `cheerio`) — no headless browser. It
works for server-rendered catalog pages, which covers most BD retailer sites, but **not**
JS-rendered single-page-app catalogs. Those need a headless-browser adapter run from an
external worker (see the original spec's §21 worker/queue diagram) rather than a Vercel
serverless function, since bundling a full browser isn't a good fit there.

## Live retailers (Star Tech, Ryans, Dazzle)

Presets for the three live retailers live in `src/adapters/scraper/presets.ts`: CSS selectors
for product cards and product pages, plus where to find the site's category menu.

### All categories, managed from the admin

Categories are not hard-coded. **Admin → Retailers → Categories → "Sync categories from site"**
reads every category link from the retailer's navigation menu and stores the list on the
retailer's data source. Then:

- each category is auto-mapped to one of ours by keyword (`lib/retailers/categoryMapping.ts`,
  using parent names too, so "Laptop › Asus" → Laptop). A category with no match (e.g. "UPS")
  gets a new category of its own under **More Categories**;
- all categories are **enabled** by default. Untick any you don't want, or pick a different
  mapping, and press **Apply**;
- re-syncing keeps your choices, adds new categories the retailer has added, and flags ones
  that disappeared from the site (switching them off) instead of deleting them.

Every enabled category is crawled page by page (`?page=N`), so the whole catalog is covered.
Changing a category's mapping only affects products found after the change; products
already imported keep their category (edit them under Admin → Products).

Per product the scraper collects **price, availability, title, URL and image** from the
listing grid, then opens a capped number of product pages per run
(`maxDetailPagesPerRun`) to backfill **description, image and specifications**. Product pages
fall back to schema.org JSON-LD and OpenGraph tags when a selector misses.

```bash
npm run scrape:check -- startech    # 1. check selectors against the live site (no DB needed)
npm run scrape:check -- ryans
npm run scrape:check -- dazzle
npm run seed:live                   # 2. register the live retailers + sync their categories, retire mock data
                                    # 3. review categories in Admin → Retailers → Categories
npm run sync                        # 4. first full crawl from your machine (no time limit)
```

After that, the 3-hourly cron keeps prices and stock fresh. Crawling every category of a big
site takes far longer than one serverless run allows. Expect the cron to need many runs to cover
a full catalog, or schedule `npm run sync` on a machine or GitHub Actions instead. Each run has a time budget, starts
one category further along than the previous run, and spends the last quarter of its budget on
product-page enrichment, so a large catalog is covered across several runs.

**Before relying on it:**

- **Selectors are unverified.** They were written from each site's known markup, but the
  build environment could not reach the sites. Run `scrape:check`, which also lists the
  categories discovered from the menu, and fix any selector that returns 0 categories or products, either in `presets.ts` (then re-run `seed:live`) or directly in the
  `DataSource.config` row.
- **Dazzle appears to render its catalog client-side.** Search engines index its category
  pages with navigation only. If `scrape:check -- dazzle` finds 0 products, Dazzle needs its
  JSON API (look in the browser's network tab) or a headless-browser worker instead.
- **Check each site's Terms of Service.** `robots.txt` is honored automatically, including
  `Crawl-delay`, and requests are spaced ≥ 2 s apart. A disallowed path is skipped, not
  scraped.
- **Images:** `next.config.ts` allows images from the three retailers' domains. If a retailer
  serves images from a separate CDN host, add that host there or `next/image` will error.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import Project** → select the repo.
3. Add the same environment variables from `.env` (`DATABASE_URL`, `DIRECT_URL`,
   `NEXT_PUBLIC_APP_URL` set to your production domain, `ADMIN_SECRET`, `CRON_SECRET`).
4. Vercel runs `npm install` → `prisma generate` (via `postinstall`) → `next build`
   automatically.
5. After the first deploy, run `npx prisma migrate deploy` (locally, pointed at the
   production `DIRECT_URL`, or via a one-off Vercel deployment hook) to apply migrations,
   then `npm run seed` if you want the same mock catalog in production.

No always-on server, Docker, or worker process is required for V1 — everything runs as
Vercel serverless functions plus (later) Vercel Cron for lightweight scheduled refreshes.

## Data sources & retailer integrations

`npm run seed` loads **deterministic mock data** (`src/adapters/mock`). `npm run seed:live`
switches Star Tech, Ryans and Dazzle to live scraping (see [Live retailers](#live-retailers-star-tech-ryans-dazzle)).
Before enabling a retailer in production, confirm the legal/technical basis: an official API
or feed if one exists, otherwise permitted scraping with robots.txt/ToS compliance.

## Note on shadcn/ui

This project's original build sandbox couldn't reach `ui.shadcn.com`, so the `shadcn` CLI
couldn't be run there. Instead, `src/components/ui/*` was hand-written to match shadcn's
conventions exactly (Radix primitives + `class-variance-authority` + the same prop/variant
shape). With normal network access, `npx shadcn@latest add <component>` will work against
the same `components.json` and drop new components into the same folder.

## Renaming

The name "DaamKoto" appears in `package.json` (`name`), `src/app/layout.tsx` metadata,
and this README. Search-and-replace those to rebrand.
