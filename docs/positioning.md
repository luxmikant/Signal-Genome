# Signal Genome — grounded teardown & positioning

_Context: written during the Into the Scrape-Verse (WeMakeDevs × Bright Data) window.
Everything in "Verified" was checked by running the repo on this machine.
Everything in "Competitive test" is structural reasoning about the typical
hackathon field — web search was unavailable in my environment (no search API
key), so no claim here about a specific named submission is made._

---

## 1. Verified state of the project (what is actually real)

| Claim | Status | Evidence |
|---|---|---|
| 14-gene canonical model, alias lexicons, weighted tagger | OK, real | packages/genes/src/registry.ts + tagger tests |
| Normalizers (per-site adapters, zod at every boundary) | OK, real | packages/engine/src/normalizer.ts, tests |
| Fitness + momentum (45-day decay) + ranker with self-explaining reasons | OK, real | packages/engine/src/fitness.ts, ranker.ts, tests |
| 5-agent harness (planner → builder → runner → validator → healer) | OK, real | apps/collector/src/harness.ts, all agents |
| Heal cycle: break → detect → heal (same c_* id) → re-run → healthy | VERIFIED LIVE | pnpm demo:break + pnpm harness --offline -> 1 healed, 0 failures |
| SSE mutation stream → helix particles | OK, real | apps/api/src/routes.ts /api/events, store.ts |
| Two-strand 3D helix (evidence ↔ interest) with honest geometry | OK, real | apps/web/src/scene/Helix.tsx |
| /api/genome serves full scored view; /api/health per-source status | VERIFIED LIVE | 14 genes, 80 items, direction with reasons returned |
| Tests + strict typecheck | GREEN | all 7 workspace projects, 0 failures |
| Windows: dev + harness simultaneously | was broken, now fixed | see section 4 |

**Not verified (be honest in the pitch):**

- Real `bdata` collector flow — the `bdata` CLI is **not installed in this
  environment**, `collectorId` is `null` in `config/state.json`, and every run
  so far used offline snapshots (`c_demo_*`). The create/run/heal commands are
  thin wrappers and the strategy is documented, but the live loop has **never
  actually run on credits**. This must be pre-recorded or demonstrated with a
  real account before judging, or simply not claimed as live.
- Seeded content is an illustrative "fossil record" (54+ items), not scraped.

---

## 2. Competitive test: the idea vs. the usual hackathon field

Typical strong entries in a scraping hackathon cluster into four archetypes:

1. **The Dataset** — scraped corpus + notebook/analysis ("we scraped X, here
   are 5 findings"). Honest, useful, low wow. Judges grade the data quality.
2. **The Agent** — LLM agent that browses/drives a scraper end-to-end.
   Impressive in demos, fragile live, and every other team has one.
3. **The Dashboard** — real-time scraper data on a map/chart. Looks like a
   product, but the scraping is plumbing; nothing reacts when sites change.
4. **The Niche Tool** — one obsessive vertical workflow (price alerts, job
   boards, X-for-Y). Competition here is about depth and polish.

**Where Signal Genome lands:** mostly archetype 3 (dashboard) with skin from 2.
That is both the risk and the opportunity.

### Where it genuinely differentiates

- **Self-healing as a first-class loop.** Almost nobody in the field treats
  drift as a product feature. In every other entry, a broken scraper is a
  failure of the demo. In yours it *is* the demo — and you have the loop,
  tests, and honest logging to prove it. This is your scarcest asset. Lead with
  it, and make it visible in the UI (it currently lives in the terminal — the
  judge's eyes are on the helix, not the logs).
- **The helix gives a 3-second "what is this?" answer.** Most entries need a
  10-minute pitch; yours can be shown and felt. That wins hallway-judging.
- **The "learn next" hook is the only entry with an *educational* payoff.**
  Scraping-hackathon judges see data, agents, and dashboards all day. An answer
  to "what should I learn before this?" is unexpected and human.

### Where it is vulnerable (the honest part)

- **Jack of all trades.** Harvesting + agents + data platform + visualization +
  personalization is five projects. The judge asks "what does this do **for
  me**, right now?" — and the current answer ("it's a knowledge organism")
  requires too much setup. The product needs one sentence that is about the
  **user's outcome**, not the architecture.
- **Personalization is thin.** Four reaction buttons ≠ a personal genome. The
  right strand of the helix is under-motivated: onboarding asks nothing about
  who you are, so the "personal" half of the pitch rests on two clicks.
- **The live flow is unproven** (see section 1). If a judge pokes at
  `pnpm harness` and watches a 10–15 min real collect, the demo dies on the
  spot. The offline path fixes this *only if* you never claim otherwise.
- **Domain narrowness cuts both ways.** "LLM inference" is a great audience
  choice (judges are technical) but it begs "why not any topic?" — have the
  one-line answer ready: the gene model is the product; inference is the first
  chromosome.

---

## 3. The refined pitch (product-first, one breath)

> **Signal Genome is your personal radar for what matters in AI infrastructure.
> It scrapes the web's best sources continuously, heals itself when those
> sites change, and shows you — as a living genome — what's rising, what's
> connected, and what to learn next.**

Three beats, each maps to a visible artifact in the existing demo:

1. *It never breaks* → the heal loop, shown in the UI (source health + a
   "self-healing" pill the judge can see on screen, not just in the terminal).
2. *It's yours* → onboarding asks 3 real questions (background, goal, tools)
   that seed the interest strand; reactions then visibly reshape the helix.
3. *It tells you what's next* → Next Best Direction card with a reason a
   human wrote ("FlashAttention is the foundation you haven't touched yet").

---

## 4. Demo-hardening checklist (P0 — do these before anything shiny)

1. **Windows bug fixed this session** — `pnpm sync` crashed with
   `ENOTEMPTY` whenever the dev server was running (which is exactly the
   demo layout: dev in one terminal, harness in another), and a mid-sync
   failure corrupted `node_modules/@signal/core` hard enough to kill the API
   with `ERR_MODULE_NOT_FOUND`. `scripts/sync-workspace.mjs` now tolerates
   locked paths, updates in place, and (key) is a **no-op when nothing
   changed** — so the running API never sees package rewrites.
   Re-verified: harness + dev simultaneously, break → heal → healthy, all
   green. **Retest the demo on the venue machine before going.**
2. **The demo must be offline-first, always.** No network at the venue, no
   `bdata` here: the snapshot-driven loop is the product. Pre-record a
   60–90 s clip of the *real* collector flow on a machine with credentials
   (any partner with a Bright Data account) as a video fallback. Never run
   live `pnpm harness` on a stage.
3. **Bake the heal story into the UI** (small): a status line in the HUD
   like "⛑ 3 self-heals · 0 collector failures survived >1 run". One line of
   code; it moves the demo's best feature from the terminal into the theater.
4. Ship one `pnpm demo` (or `pnpm preview`) that bootstraps the entire
   experience from a clean clone in under 60 seconds, including seeding; the
   current path (install → seed → dev) is fine but has 3 steps — collapse it.

## 5. "Cool product" moves — ranked by payoff per hour (P1)

| Move | Why it scores | Effort |
|---|---|---|
| **Genome diff/mutations ticker** — "This week the web changed 3 things about memory: …" (SSE already delivers these events; render them as a digest panel) | Judges see *liveness*; it's the one thing dashboards never show: change over time told as a story | small |
| **Onboarding with 3 real questions** mapped to gene weights (background / goal / tools) | Makes "personal genome" true; a judge answering 3 questions is now invested | small |
| **Shareable genome card** — snapshot the helix + top 3 directions to an image/"your genome" URL | Exports are the classic hackathon shareable; makes your project *their* artifact | medium |
| **"Why this matters" on every gene panel** — one sentence + 1 link with the strongest recent evidence | Converts the educational hook from abstract to tangible; demo script already clicks panels | small |
| **Health scoreboard as a first-class panel** — uptime, last healed, per-source item counts (exists as drawer; promote it) | The "never breaks" claim becomes a visible KPI | small |

## 6. The one-liners to keep on the wall

- "Live scraping" unproven → never claim it; show the offline loop + a
  pre-recorded real run.
- Too many stories → cut everything that isn't *radar → genome → next step*.
- The helix is the bait; make sure the gene panel is the hook, and the
  timestamped mutations are the proof of life.
