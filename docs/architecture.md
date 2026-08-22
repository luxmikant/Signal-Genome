# Signal Genome — Architecture

## One picture

```
                    ┌─────────────────────────  apps  ─────────────────────────┐
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────────┐
│  collector           │   │  api                 │   │  web                     │
│  multi-agent harness │ ─▶│  Fastify + SQLite    │ ─▶│  Vite + R3F helix        │
│  bdata CLI wrappers  │INJ│  REST + SSE bus      │   │  panels + companion      │
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
packages/engine      normalizers, momentum fitness, next-direction ranker, view model   (pure)
packages/seed-content 54-item historical genome (the "fossil record")                   (pure)
  ── dependency arrow is enforced by convention: apps → packages, engine → genes → core

apps/collector       the harness loop. agents: planner, builder, runner, validator, healer
apps/api             the genome engine: SQLite, REST, SSE, ingest endpoint
apps/web             the theater: 3D helix, gene panels, companion, health view
```

## The five agents (apps/collector)

| Agent          | Responsibility                                                    | Failure mode it absorbs |
| -------------- | ----------------------------------------------------------------- | ---------------------- |
| planner        | reads `config/state.json`, decides create / run / heal / idle     | stale or broken sources |
| builder        | `bdata scraper create <url> "<prompt>"` → registers `c_*` id      | sites that never had a collector |
| runner         | `bdata scraper run <id> <url> --pretty`, saves raw JSON           | network / parse failures |
| validator      | coverage checks (titles, urls, bodies) per source, drift report   | layout drift → heals |
| healer         | `bdata scraper heal <id> "<what broke>"` — same id, same schema   | the changed web |

The loop: `planner → builder → runner → validator → (healer → runner) → ingest → SSE → helix`.

## Data contract

Every boundary is validated with zod (`packages/core/schemas.ts`):
raw scraper JSON → normalizer (`SourceShape` adapters per site) → `ContentSchema` → tagger → `TagEdge[]` → SQLite.

## Why the geometry is honest

- Left strand = **Evidence** (what the web says). Node size ∝ log(evidence count), glow ∝ momentum (exponential decay, 45-day half life), color = concept family.
- Right strand = **Interest** (what you do). Ring/wireframe artifacts ∝ reaction intensity.
- Rungs = concept ↔ evidence bridges. Opacity ∝ interest × evidence.
- Vertical axis = maturity: foundational (bottom) → emerging (top).
- Pulse = evidence arrived since your last visit. SSE `mutation` events drive particles into the exact target gene.

## Reproducibility

- `pnpm test` — node:test suites for tagger, normalizer, ranker, view model.
- `pnpm typecheck` — strict TS across all five packages.
- `data/genome.sqlite` is regenerated with `pnpm seed` + `pnpm harness --offline` (no credits needed).
