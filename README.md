# 🏙 Signal Genome — the Knowledge City

> **The web's knowledge about fast-moving tech, built into a living city.**
> Bright Data Scraper Studio collectors pull public engineering content; a five-agent
> harness builds, runs, validates and **heals** those collectors; the structured data becomes
> a vibrant 3D city where **every building is a real source**, every tower a landmark
> repository, every crane a rising idea — and a time scrubber rebuilds the city month by
> month, from 2023 to now.

Built for **Into the Scrape-Verse** (WeMakeDevs × Bright Data, Aug 2026).

---

## What it is doing

Signal Genome turns fragmented public technical knowledge (blogs, docs, changelogs) into
**one spatial picture you can remember**: a city. Instead of a feed that answers "what was
published today", the city answers **what matters, how things connect, what changed, and
what to learn next** — and it keeps working when the web moves under it.

## How the right data solves the problem

Developers trying to keep up with a field face three problems — signal is scattered, feeds
are chronological instead of educational, and scrapers silently die. The city fixes all three:

- **Curated collection** — four long-tail sources (vLLM docs, Unsloth, Modal, Anyscale blogs)
  scraped through Scraper Studio, not a pre-built library.
- **Structure over chronology** — 14 canonical concepts, 18 landmark repositories, and the
  prerequisite roads between them.
- **Self-healing collection** — the five-agent harness validates every run and repairs
  broken collectors in place: same `c_*` Collector ID, same JSON schema, nothing downstream
  notices.

## How the data came from

```bash
bdata scraper create <url> "<plain-language extraction spec>"   # builder
bdata scraper run <collector_id> <url> --pretty                 # runner
bdata scraper heal <collector_id> "<what broke>"                # healer
```

Live collector IDs (in `config/state.json`): `c_mt42mr6y1zwlpo0mu1` (vLLM docs),
`c_mt42msus6ft09x2sm` (Unsloth), `c_mt46nmay2owkiw51mz` (Modal · 129 items),
`c_mt470woq24l2b1fx7i` (Anyscale · 321 items). Two of them hit a real heal conflict —
and the city shows it (red beacons; failures are never hidden).

## How the data is managed

```
collector harness → POST /api/internal/ingest (normalized content)
→ zod-validated normalizers → SQLite
→ gene tagger + momentum fitness + trend series
→ REST /api/city (+?at=), /api/trends + SSE /api/events → the city
```

Every boundary is typed and zod-checked; the engine is pure, unit-tested logic
(`packages/engine`, `packages/genes`); the UI never trusts raw scraper output.

## What the final outcome is

**THE KNOWLEDGE CITY** — the one and only view, with an honest visual grammar:

- **Buildings** = evidence items; **height** = relevance; **lit** = fresh (45-day decay);
  **dim/sunk** = abandoned ideas
- **The main avenue** = the posh street: landmark repositories line it — **vLLM ↔ llama.cpp**
  with **SGLang, bitsandbytes, AutoAWQ, GPTQ** as glowing bridge towers between them —
  the path that shows how technology A connects to technology B
- **Roads** = prerequisite concepts and repo relations (fork/integrates/reimplements);
  **traffic pulses** flow along them by momentum
- **Cranes** = emerging ideas (click → "learn KV Cache first"); **gold obelisks** = foundations
- **Hot ring** = the busiest district; **HUD badges** = quarter-over-quarter rises
  (▲ Paged Attention +1264%)
- **Time journey** = scrub 2023 → now, press ▶, watch the city get built district by district
- **Plasmi** — a little organism that floats over the skyline and announces new evidence

## Run it

```bash
pnpm install
pnpm dev                 # api (8787) + web (5173) → http://localhost:5173
pnpm harness             # live Bright Data loop (uses credits)
pnpm harness --offline   # the same loop, zero credits (bundled snapshots)
pnpm demo:break          # simulate a site change → watch it heal
pnpm test && pnpm typecheck
```

## Deploy to Vercel

The repo is deploy-ready: `vercel.json` ships the Vite app as a static site and
`api/index.ts` as the serverless API (Fastify app mounted on a function; SQLite rebuilds
from the seed in `/tmp` at cold start; native `better-sqlite3` binary shipped via
`includeFiles`).

```bash
npm i -g vercel && vercel   # or: import the repo at vercel.com
```

## Project layout

```
packages/core          schemas, content model, family palette        (zero deps)
packages/genes         14 canonical genes + weighted tagger          (pure, tested)
packages/engine        normalizers, fitness, ranker, trend series    (pure, tested)
packages/ecosystem     landmark repositories, relations, lineage     (pure, tested)
packages/seed-content  54-item historical seed
apps/collector         bdata CLI wrappers + the 5-agent harness
apps/api               Fastify + SQLite + REST + SSE
apps/web               the Knowledge City (React + Three.js)
api/index.ts           Vercel serverless entry
docs/                  architecture, demo script, pitch
```

## Honesty & disclosures

- Built with AI coding assistants (disclosed per hackathon rules); every module is small,
  tested and explainable.
- Landmark repository star counts are curated round magnitudes for visual scale —
  the evidence buildings are real scraped content.
- Public pages only: no login walls, no paywalls, no government sites, no personal data.

Details: `docs/architecture.md` · `docs/demo-script.md` · `docs/about.md`
