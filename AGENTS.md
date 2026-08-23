# Signal City

This file is pinned into every coding-agent session.

## What this is

A self-healing knowledge organism. Bright Data Scraper Studio collectors (custom
`c_*` IDs built with `bdata scraper create`) continuously pull public technical
content about LLM inference. A multi-agent harness loop builds, runs, validates
and HEALS those collectors. Normalized content feeds a fitness engine that scores
~14 canonical "genes" (concepts) and lights them up in **THE KNOWLEDGE CITY**:
a 3D metropolis where every building is one scraped source, districts are
concepts, cranes are emerging ideas, and a time scrubber replays the industry
trend from 2023 to now. One view. No feeds, no tables.

## Commands (root)

- `pnpm dev` — start API (8787) + web dev server (5173) with the city
- `pnpm harness` — run the collector harness loop (create → run → validate → heal)
- `pnpm harness --offline` — same loop against bundled snapshots (no credits)
- `pnpm create` / `pnpm run` / `pnpm heal` / `pnpm health` — single-command bdata flows
- `pnpm demo:break` — simulate a site layout change (demo of self-healing)
- `pnpm seed` — (re)load the historical seed genome into the API DB
- `pnpm test` / `pnpm typecheck` — unit tests + type checks

## Pipeline contract

collector harness → POST /api/internal/ingest (normalized content)
→ SQLite → engine (tagger / fitness / trends / ranker)
→ REST /api/city (+ ?at=) + /api/trends + SSE /api/events → web Knowledge City

## Bright Data Collector IDs (real, live)

| Source        | URL                  | Collector ID          | State    |
| ------------- | -------------------- | --------------------- | -------- |
| vllm-docs     | https://docs.vllm.ai | c_mt42mr6y1zwlpo0mu1 | healing  |
| unsloth-blog  | https://unsloth.ai/blog | c_mt42msus6ft09x2sm | healing  |
| modal-blog    | https://modal.com/blog | c_mt46nmay2owkiw51mz | healthy  |
| anyscale-blog | https://www.anyscale.com/blog | c_mt470woq24l2b1fx7i | healthy  |

Preferred source classes: engineering blogs, docs sites, changelogs, public
community posts, show notes. Public data only. No gov, no login-walled sites.

## Rules the agent must follow

- Always reuse existing Collector IDs (`config/state.json`); never rebuild
  unless the registered ID is broken.
- Scaffold code goes in packages/ (pure, tested). Keep dependency direction:
  apps → packages, engine → genes → core.
- Conventional Commits. No secrets in the repo or in stdout logs.