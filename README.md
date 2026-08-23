# Signal Genome

Your radar for what's changing in AI tooling. Bright Data scrapes the web, a self-healing agent loop keeps the scrapers alive when sites change, and the data comes out as **THE KNOWLEDGE CITY** — a living 3D metropolis where every building is a real fact, every crane a rising idea, every lit window fresh evidence.

Built for **Into the Scrape-Verse** (WeMakeDevs × Bright Data, Aug 2026).

## Why it exists

Most scraping projects are a pipeline that breaks silently and a dashboard of tables. We wanted two things instead:

- scrapers that **repair themselves** — sites change layout all the time, so collectors shouldn't just die
- data that reads like a **story**, not a spreadsheet

## How we use Bright Data

Every content source gets its own Scraper Studio collector. We describe what to extract in plain English and get structured JSON back. Each source goes through a 5-agent loop:

1. **planner** — decides which sources are due
2. **builder** — registers a collector on Scraper Studio (`bdata scraper create`)
3. **runner** — executes it (`bdata scraper run`)
4. **validator** — checks the output against the expected schema
5. **healer** — describes the break back to Scraper Studio and re-runs the *same* collector

The loop is the point. When a site changes, validation fails, the healer explains the new structure, and the collector heals in place — same collector id, no manual fixes. It has already happened for real: healthy collector IDs `c_mt46nmay2owkiw51mz` (Modal · 129 items) and `c_mt470woq24l2b1fx7i` (Anyscale · 321 items), while `c_mt42mr6y1zwlpo0mu1` and `c_mt42msus6ft09x2sm` hit a real heal conflict — and the city keeps both visible (red beacons, honest health panel).

```bash
pnpm harness             # live Bright Data flow (uses credits)
pnpm harness --offline   # same loop against bundled snapshots (no credits)
pnpm health              # per-source status board
```

## What we scrape

**Document sources** (Bright Data Scraper Studio): vLLM docs (sitemap), Unsloth blog, Modal blog, Anyscale blog (discovery). Each item: title, url, author, publish date, body, tags. Public pages only.

## How we visualize it — THE KNOWLEDGE CITY

The one and only view. A city built from the web, its visual grammar is fully honest:

- **Buildings** are sources — an engineering blog post, a documentation page, a release note. **Height** = importance; **lit windows** = freshness (45-day decay).
- **Districts** are concepts, orbiting the city on a ring; each carries a **health beacon** (green = collector healthy, amber = healing, red = failed — failures stay visible, never hidden).
- **Gold obelisks** = foundational concepts (the thing to learn first). **Dim half-sunk blocks** = abandoned ideas.
- **Construction cranes** swing over emerging ideas; clicking one opens the site: *"Speculative decoding — 32 fresh sources this month; learn KV Cache first."*
- **Roads** connect prerequisite concepts; when a road is busy, **traffic pulses** run its length — ideas discussed, flowing toward what they depend on.
- **The hot ring** pulses around the single most active district; **rising badges** in the HUD show quarter-over-quarter momentum (▲ Paged Attention +1264%).
- **The time journey** (bottom scrubber) lets you fly back to 2023 and watch the city get built month by month — trends become a landscape you can walk through. Press ▶ and it builds itself.
- **Plasmi**, a little glowing organism, floats over the city and announces when new evidence lands via the live SSE stream.

Entered after a cinematic arrival screen: *"The signal is alive. A feed is a blur — a city, you can remember."*

## How we represent the data

- Typed end-to-end, with zod at every boundary.
- Drift is expressed in readable capability axes (loop, gateway, plugins, …), not raw logs.
- Facts carry confidence chips (verified / approx) — a pretty tree of made-up facts would be worse than a plain chart.
- The same layout math drives a static SVG snapshot, so the tree is embeddable anywhere.

## The pipeline

```
Bright Data Scraper Studio (c_* collectors)
  → 5-agent harness (create → run → validate → heal)
  → POST /api/internal/ingest (zod normalizers)
  → SQLite
  → gene tagger + fitness + ranker
  → REST /api/city /api/trends + SSE /api/events
  → KNOWLEDGE CITY (3D)

GET /api/city → districts, buildings (sources), roads (prerequisites), learn-next route
GET /api/city?at=<date> → the same city, as it stood at any month since 2023
```

## What's unique here

- **The heal loop is the product.** A broken scraper is the demo, not an incident.
- **The city is honest by construction.** Every light = evidence with a link; every red beacon = a real collector failure, never hidden.
- **Trends become geography.** Scrub the time slider and watch the city rise district by district — industry momentum as a landscape.
- **An educational payoff.** The learn-next route says *what to learn first and why* — not just what changed today.

## Run it

```bash
pnpm install
pnpm seed                # historical genome data (54 items)
pnpm dev                 # open http://localhost:5173
pnpm harness             # live Bright Data scraping loop
pnpm demo:break          # simulate a site change, then watch the loop heal
```

## Project layout

```
packages/core          content model, schemas, palette
packages/genes         14 genes + weighted tagger
packages/engine        normalizers, fitness, ranker, trends, view model
packages/ecosystem     GitHub trend fetch, lineage facts, tree layout, SVG snapshot
packages/seed-content  historical seed data
apps/collector         bdata wrappers + the 5-agent harness
apps/api               Fastify + SQLite + REST + SSE
apps/web               React: the KNOWLEDGE CITY (3D)
docs/                  architecture, demo script, about, pitch
```

Details live in `docs/architecture.md` and `docs/demo-script.md`.