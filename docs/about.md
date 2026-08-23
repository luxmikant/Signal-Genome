# Signal City — about

## The one-liner

**Signal City is a self-healing, personalized technology radar.** Bright Data Scraper Studio collectors continuously pull public technical knowledge from blogs, documentation, changelogs and community sources. A multi-agent harness builds, runs, validates and rep — **heals** — those collectors when a site changes layout. Normalized content feeds a fitness engine that scores ~14 canonical genes of knowledge for a user's personal genome, rendered as a living DNA helix. The left strand is what the web says; the right strand is what you care about; the bridges show where they meet.

## Why not another feed?

A feed answers "what happened". Signal City answers:

- What does this new information connect to?
- Why should I care right now?
- What should I learn before this?
- Is this concept accelerating, fading, or changing?
- What is the next most valuable thing for **me** to understand?

## Self-healing is the foundation, not a checkbox

Scrapers break quietly. Our pipeline treats that as a first-class event:

```
site changes → collector returns empty → validator flags drift
→ healer sends bdata scraper heal (same c_* id, same JSON schema)
→ re-run → same schema → nothing downstream ever sees a gap
```

## How Scraper Studio is used (honest list)

1. **One prompt, one URL.** Each site in `config/sources.json` carries its own plain-language extraction prompt. `bdata scraper create <url> "<prompt>"`.
2. **Collector IDs are production endpoints.** The harness treats every `c_*` id as the registry key for that source — never rebuilt unless broken (rule pinned in `AGENTS.md`).
3. **Self-healing is exercised as a core loop**, not a one-off demo: planner → runner → validator → healer → runner.
4. **The 10–15 minute cost is real.** We parallelize (concurrency 2), validate post-hoc, and use the Collector ID as an API to keep the genome current without humans.
5. **Public data only.** Blogs, docs, changelogs we own and curate. No login walls, no paywalls, no government sites, no personal data.

## Honesty note

The bundled `packages/seed-content` items are an illustrative historical dataset ("fossil record") compiled from public knowledge of the field so the helix is fully populated on first boot; live collector runs replace/extend it with freshly scraped content. The demo break is simulated via `pnpm demo:break`; the same loop runs against real collector failures without any change.
