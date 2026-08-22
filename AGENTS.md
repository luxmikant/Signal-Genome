# Signal Genome

This file is pinned into every coding-agent session.

## What this is

A self-healing knowledge organism. Bright Data Scraper Studio collectors (custom
`c_*` IDs built with `bdata scraper create`) continuously pull public technical
content about LLM inference. A multi-agent harness loop builds, runs, validates
and HEALS those collectors. Normalized content feeds a fitness engine that scores
~14 canonical "genes" (concepts) for a user's personal knowledge genome. The
default UI is the **LINEAGE tree**: a radial evolution tree of the AI-tool
ecosystem (Claude Code → Clawdbot → OpenClaw → DeepSeek Harness …) fed by live
GitHub trend scraping plus a curated, source-verified lineage. The DNA helix
remains as the "genome" view (HUD switch).

## Commands (root)

- `pnpm dev` — start API (8787) + web dev server (5173)
- `pnpm harness` — run the collector harness loop (create → run → validate → heal)
- `pnpm create` / `pnpm run` / `pnpm heal` / `pnpm health` — single-command bdata flows
- `pnpm trends` — scrape top AI-ecosystem repos from GitHub → `data/ecosystem.json`
- `pnpm demo:break` — simulate a site layout change (demo of self-healing)
- `pnpm seed` — (re)load the historical seed genome into the API DB
- `pnpm test` / `pnpm typecheck` — unit tests + type checks

## Pipeline contract

collector harness → POST /api/internal/ingest (normalized content)
→ SQLite → engine (tagger / fitness / ranker) → SSE /api/events → web helix

ecosystem: GitHub search API (no auth, 5 topic queries) + curated lineage facts
(`packages/ecosystem/src/lineage.ts`) → `data/ecosystem.json`
→ GET /api/ecosystem → web LINEAGE tree (default view)

## Bright Data Collector IDs

Planned sources (register after running `pnpm create`):

| Source        | URL                  | Strategy  |
| ------------- | -------------------- | --------- |
| vllm-docs     | https://docs.vllm.ai | sitemap   |
| unsloth-blog  | https://unsloth.ai/blog | discovery |
| modal-blog    | https://modal.com/blog | discovery |
| anyscale-blog | https://www.anyscale.com/blog | discovery |

Preferred source classes: engineering blogs, docs sites, changelogs, public
community posts, show notes. Public data only. No gov, no login-walled sites.

## Rules the agent must follow

- Always reuse existing Collector IDs (`config/state.json`); never rebuild
  unless the registered ID is broken.
- Scaffold code goes in packages/ (pure, tested). Keep dependency direction:
  apps → packages, engine → genes → core.
- Conventional Commits. No secrets in the repo or in stdout logs.
