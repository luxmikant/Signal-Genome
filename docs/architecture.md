# Signal Genome — Architecture

## One picture

```
                    ┌─────────────────────────  apps  ─────────────────────────┐
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────────┐
│  collector           │   │  api                 │   │  web                     │
│  multi-agent harness │ ─▶│  Fastify + SQLite    │ ─▶│  Vite + R3F              │
│  bdata CLI wrappers  │INJ│  REST + SSE bus      │   │  THE KNOWLEDGE CITY      │
└──────────────────────┘   └──────────────────────┘   └──────────────────────────┘
          ▲                          │                          ▲
          │ (bdata scraper create)   ▼ (zod at every boundary)  │ (EventSource)
     Bright Data Scraper Studio ── Normalized content ── tags ──┘
          ▲
          │  planners: create → run → validate → heal (same c_* id)
     the public web (docs, blogs) + time
```

## Modules

```
packages/core        zod schemas, content model, gene/reaction types, family palette   (zero deps)
packages/genes       14 canonical genes + alias lexicons + weighted tagger              (pure)
packages/engine      normalizers, momentum fitness, ranker, trend series, view model    (pure)
packages/ecosystem   GitHub trends + curated lineage facts + SVG tree snapshot          (pure)
packages/seed-content 54-item historical genome (the "fossil record")                   (pure)
  ── dependency arrow is enforced by convention: apps → packages, engine → genes → core

apps/collector       the harness loop. agents: planner, builder, runner, validator, healer
apps/api             the genome engine: SQLite, REST, SSE, ingest endpoint, city model
apps/web             the theater: the 3D Knowledge City + panels + companion
```

## The five agents (apps/collector)

| Agent          | Responsibility                                                    | Failure mode it absorbs |
| -------------- | ----------------------------------------------------------------- | ---------------------- |
| planner        | reads `config/state.json`, decides create / run / heal / idle     | stale or broken sources |
| builder        | `bdata scraper create <url> "<prompt>"` → registers `c_*` id      | sites that never had a collector |
| runner         | `bdata scraper run <id> <url> --pretty`, saves raw JSON           | network / parse failures |
| validator      | coverage checks (titles, urls, bodies) per source, drift report   | layout drift → heals |
| healer         | `bdata scraper heal <id> "<what broke>"` — same id, same schema   | the changed web |

The loop: `planner → builder → runner → validator → (healer → runner) → ingest → SSE → city`.

## The Knowledge City: honest visual grammar

| City element | Data meaning | API field |
|---|---|---|
| Building | one evidence item (post / doc page / changelog) | `CityBuilding` |
| Building height | importance to the user (tag weight + freshness) | `importance (0..1)` |
| Lit windows | freshness — 45-day exponential decay | `freshness (0..1)` |
| District (ring of 14) | canonical concept (gene) | `CityDistrict` |
| Blue-ring beacon | collector health per source → district is never silent about a break | `beacon: healthy/healing/failed` |
| Gold obelisk | foundational concept — the thing to learn first | `maturity: foundational` |
| Construction crane | emerging concept with fresh evidence | `emerging` |
| Half-sunk dim block | abandoned idea (>90 days unseen) | `archived` |
| Roads | prerequisite relationships | `CityRoad` |
| Traffic pulses on a road | momentum of discussion flowing along it | district `momentum` |
| Hot pulsing ring | the most active district right now | max `momentum` |
| Rising HUD badges | quarter-over-quarter momentum delta (trend series) | `/api/trends` rising |
| Time journey scrubber | the city as it stood at any month since 2023 | `/api/city?at=<date>` |

The companion (Plasmi) reacts to SSE `mutation` events: new evidence lands in the city and it announces it.

## Data contract

Every boundary is validated with zod (`packages/core/schemas.ts`):
raw scraper JSON → normalizer (`SourceShape` adapters per site) → `ContentSchema` → tagger → `TagEdge[]` → SQLite.

## Reproducibility

- `pnpm test` — node:test suites for tagger, normalizer, ranker, trends, view model.
- `pnpm typecheck` — strict TS across all five packages.
- `data/genome.sqlite` is regenerated with `pnpm seed` + `pnpm harness --offline` (no credits needed).
