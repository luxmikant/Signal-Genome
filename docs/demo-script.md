# Demo script — a 3-minute judge walkthrough

## Beats

### 0:00 — The pitch (15 seconds)
> "This is Signal Genome. A self-healing knowledge organism. Bright Data collectors read the web; an agent harness heals itself when the web moves; and the result is a DNA helix of what matters in LLM inference — and what you should learn next."

### 0:15 — Terminal: the harness
```
pnpm harness
```
Show the loop: planner → builder → runner → validator → healer. Point at the logger: each agent states what it did. Mention that each `bdata scraper run` costs 10–15 minutes, so the harness parallelizes sources at concurrency 2 and writes raw JSON to `data/raw/`.

### 0:45 — The break (the money moment)
```
pnpm demo:break --source vllm-docs
pnpm harness
```
- Validator reports `broken` (coverage dropped).
- Healer dispatches `bdata scraper heal c_xxxxx "The site changed its layout… Keep the JSON schema unchanged"` — **same Collector ID**.
- Re-run the exact same collector. Same schema returns.
- In the demo video this beat is also shown with **real** bdata output if credits allow (see docs/about.md).

### 1:20 — The helix (theater)
- Open http://localhost:5173 → onboarding (`What do you want to understand next?`) → "Sequence my genome".
- Explain the two strands in one line: *"Left is what the web says, right is what you care about, bridges show where they meet."*
- If mutated while open: plasmon particles spiral into the gene; **Plasmi**, the companion, flashes a bubble: *"mutation! the web said something new."*
- Click **KV Cache** → panel opens: blurb, momentum pills, learn-first prerequisites, recent mutations with source cards linking to the original public pages.

### 2:10 — Next best direction
- Show the bottom-left card. Read one reason: *"Missing prerequisite — FlashAttention is the foundation you have not touched yet."*
- Click a reaction button. Watch the interest strand light up in real time; the recommendation card recomputes.

### 2:35 — Source health
- Top-right: **source health** drawer — per-source status, collector ids, extracted counts.

### 2:50 — Close
> "No feed, no chatbot. Your own evolving genome: the web keeps changing, and this organism never breaks."

## Rehearsal notes
- Run `pnpm dev` (api + web) before guests arrive; seed is automatic on first boot.
- Keep a second terminal with `pnpm harness` pre-typed.
- If web fonts don't load (no internet at venue): the UI falls back to system fonts — still fine.
