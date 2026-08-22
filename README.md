# 🧬 Signal Genome

> **A self-healing knowledge organism.** Bright Data Scraper Studio collectors pull public LLM-inference content; a multi-agent harness **builds, runs, validates and heals** those collectors; a fitness engine scores ~14 canonical "genes" for your personal genome — rendered as a living DNA helix that mutates as the web changes.

**Left strand = what the web says. Right strand = what you care about. Bridges = where they meet.**

```
pnpm dev                     # api (8787) + web (5173)
pnpm harness                 # collector loop: create → run → validate → heal
pnpm demo:break              # simulate a site layout change → watch the loop heal it
pnpm test / pnpm typecheck   # unit tests + strict type checks
```

Built for **Into the Scrape-Verse** (WeMakeDevs × Bright Data, Aug 17–23 2026).

---

## The problem

1. **Signal is fragmented** — inference knowledge lives in engineering blogs, docs, changelogs and community posts.
2. **Feeds are chronological, not educational** — they answer "what happened today", not "what matters, what changed, what should I learn first".
3. **Scrapers silently break** — a site changes layout, the collector returns empty, nobody notices.

Signal Genome answers all three: curated self-healing collection + concept genome that explains **why** you should care and **what to learn next**.

## Quickstart

```bash
pnpm install
pnpm seed                # load the historical fossil record (54 items)
pnpm dev                 # open http://localhost:5173
```

No Bright Data credentials required to see the product — the harness runs in **offline mode** against bundled fixtures:

```bash
pnpm harness --offline   # runs the full loop without consuming credits
pnpm demo:break          # breaks vllm-docs
pnpm harness --offline   # watch: planner → validator → healer → re-run → healthy
```

## Live Bright Data flow (real credits)

```bash
pnpm harness             # 1) creates collectors (5-15 min each), runs, validates, ingests
                         # 2) on drift: bdata scraper heal <same c_* id> → re-run
pnpm health              # source health board: status, collector ids, extracted counts
```

Sources (`config/sources.json`): **vLLM Docs** (sitemap strategy), **Unsloth Blog**, **Modal Blog**, **Anyscale Blog** (discovery strategy) — all long-tail public technical sites, none in Bright Data's pre-built library.

## How the data becomes the product

```
Bright Data Scraper Studio collectors (c_* ids)
        ↓  bdata scraper run · raw JSON
multi-agent harness (planner / builder / runner / validator / healer)
        ↓  validated, drift-aware
POST /api/internal/ingest
        ↓  zod-restricted normalizers (per-site adapters)
SQLite genomes DB
        ↓  gene tagger + fitness scorer + next-direction ranker
REST /api/genome + SSE /api/events
        ↓
living DNA helix   ·   gene detail panels   ·   source health
```

### The helix is honest, not decorative

| Visual | Meaning |
|---|---|
| Node size | log(evidence count) for that gene |
| Glow / pulse | momentum: 45-day exponential decay of recency |
| Color | concept family (attention, memory, serving, compute…) |
| Vertical axis | maturity: foundational → emerging |
| Rung opacity | interest(you) × evidence(the web) |
| Particle burst | a mutation (new scraped item) struck that gene |

### Next Best Direction (the hook)

The ranker chooses the highest-value unexplored gene and **explains itself**:

- *Missing prerequisite* — X is the foundation you have not touched yet
- *High momentum* — N sources, M from the last month
- *Connects to what you follow* — shares roots with something you followed

## Repo structure (dependency direction: apps → packages)

```
packages/core          schemas, content model, family palette      (zero deps)
packages/genes         14 genes, alias lexicons, weighted tagger   (pure, tested)
packages/engine        normalizers, fitness, ranker, view model    (pure, tested)
packages/seed-content  54-item historical genome "fossil record"
apps/collector         bdata CLI wrappers + 5-agent harness loop
apps/api               Fastify + SQLite + REST + SSE mutation stream
apps/web               React + Three.js helix, companion, panels
docs/                  architecture, demo script, pitch
```

## Self-healing: what can break, and who catches it

| Failure | Detector | Repair |
|---|---|---|
| Site layout change | validator coverage checks | `bdata scraper heal` same collector id |
| Collector returns empty | validator (zero items) | heal + re-run |
| Non-JSON / schema drift | normalizer + zod | heal + re-run |
| Site is stale | planner (36h freshness) | scheduled re-run |

## Notes on data ethics

- Public pages only. No login-walled, paywalled, personal or government content.
- The harness never stores credentials; `bdata` auth stays local to the machine.
- Seed items are an illustrative historical dataset, disclosed in `docs/about.md`.

## Disclosures

- Built with AI coding-assistants (per hackathon rules); every module is small, tested, and explainable — the architecture diagram is the single source of truth (`docs/architecture.md`).
- Better-sqlite3 prebuilt addon: `npx prebuild-install` inside `node_modules/better-sqlite3` if the install script was skipped by your package manager.

## Roadmap (legit, not promised)

Community discussions as a sixth source · transcript ingestion · multi-domain genomes (robotics, cybersecurity) · per-concept sentiment evolution · scheduler for overnight runs with auto-heal watchdogs.
