# Demo script — a 3-minute judge walkthrough

## Beats

### 0:00 — The pitch (15 seconds)
> "This is Signal Genome — a living knowledge city. Bright Data collectors read the web; an agent harness heals itself when the web moves; and the city you see is built entirely from real evidence — every building is a source, every crane a rising idea."

### 0:15 — The arrival (cinematic)
- The city hovers in the dark. The overlay reads: *"A feed is a blur — a city, you can remember."*
- Enter. The camera dives from above the city into the ring of districts.
- Point out the grammar in one line: *"Buildings are evidence, height is relevance, lit windows are freshness, cranes are emerging ideas."*

### 0:45 — The break (the money moment)
```
pnpm demo:break --source vllm-docs
pnpm harness
```
- The validator reports a break; the healer dispatches `bdata scraper heal c_xxxxx "The site changed… keep the JSON schema unchanged"` — **same Collector ID**.
- The district beacon flickers amber then green; nothing downstream skipped a beat.
- This is also visible in the city without any action: the health beacon per district turns red for any source currently broken — failures are never hidden.

### 1:20 — Trends become geography
- Drag the bottom time slider back to 2023 and press ▶. The city builds itself month by month: empty grid → Attention quarter → memory quarter flares up → cranes rise in 2025–26.
- Point at the HUD badges: **▲ Paged Attention +1264%** — the trend is a number AND a block of buildings you can fly into.

### 1:50 — The crane (the hook)
- Click a **construction crane**. The site card opens: *"Speculative decoding — 32 fresh sources this month; learn KV Cache first."*
- Click the route step; the camera flies there. The learn-next strip shows the prerequisite chain, each step clickable.

### 2:20 — Evidence is real
- Click any building → the evidence drawer opens with the original source link (open it live if online).
- Traffic pulses run along the prerequisite roads; the hot ring marks the busiest district.

### 2:45 — Close
> "No feed. No chatbot. A city that grows while the web keeps changing — because the scrapers it's built on heal themselves."

## Rehearsal notes
- Run `pnpm dev` in advance; `pnpm seed` on a fresh clone; the arrival screen needs no login.
- Keep a second terminal with `pnpm harness` and `pnpm demo:break` pre-typed.
- Live collectors already present in `config/state.json` (real `c_*` ids) — evidence the flow ran against real sites.
