import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadEcosystem } from "./index.js";
import { findEcosystemDataPath } from "./paths.js";
import { RING, bezierControl, computeTreeLayout, fieldSlot } from "./tree.js";
import type { EcoSnapshot } from "./types.js";

/**
 * Renders the lineage tree to a static SVG snapshot (docs/screenshots/lineage.svg).
 * Same layout math as the live view — the image is generated from real data.
 */

const W = 1200;
const H = 675;
const VIOLET = "#7C5CFF";
const MINT = "#2EE6A8";
const INK = "#E8ECF4";
const DIM = "#8A93A6";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function nodeRadius(stars: number | null, isSeed: boolean): number {
  if (isSeed) return 13;
  return 4.5 + 2.1 * Math.log10(Math.max(stars ?? 30, 30));
}

export function renderSvg(snap: EcoSnapshot): string {
  const layout = computeTreeLayout(
    snap.lineage.nodes.map((n) => ({ id: n.id, born: n.dates.born })),
    snap.lineage.edges.map((e) => ({ from: e.from, to: e.to })),
  );
  const field = [...snap.field]
    .filter((n) => n.metrics)
    .sort((a, b) => (b.metrics?.stars ?? 0) - (a.metrics?.stars ?? 0))
    .slice(0, 30)
    .map((n, i) => {
      const slot = fieldSlot(i, RING * 3.3);
      return { name: n.name, x: slot.x, y: slot.y, spd: n.metrics?.starsPerDay ?? 0 };
    });

  const maxR = RING * 3.6;
  const scale = Math.min(W, H) / (2 * maxR) - 0.02;
  const tx = (x: number): number => W / 2 + x * scale;
  const ty = (y: number): number => H / 2 + y * scale;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  parts.push(`<defs>
  <radialGradient id="bgGlow"><stop offset="0%" stop-color="#7C5CFF" stop-opacity="0.10"/><stop offset="60%" stop-color="#7C5CFF" stop-opacity="0.02"/><stop offset="100%" stop-color="#7C5CFF" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowViolet"><stop offset="0%" stop-color="#7C5CFF" stop-opacity="0.35"/><stop offset="40%" stop-color="#7C5CFF" stop-opacity="0.12"/><stop offset="100%" stop-color="#7C5CFF" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowMint"><stop offset="0%" stop-color="#2EE6A8" stop-opacity="0.4"/><stop offset="100%" stop-color="#2EE6A8" stop-opacity="0"/></radialGradient>
</defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="#0B0E14"/>`);
  parts.push(`<rect width="${W}" height="${H}" fill="url(#bgGlow)"/>`);

  // field dust
  for (const f of field) {
    const hot = Math.min(1, f.spd / 300);
    parts.push(
      `<circle cx="${tx(f.x).toFixed(1)}" cy="${ty(f.y).toFixed(1)}" r="${(1.1 + hot * 2.6).toFixed(1)}" fill="${hot > 0.55 ? MINT : VIOLET}" opacity="${(0.16 + hot * 0.5).toFixed(2)}"/>`,
    );
  }

  // edges
  for (const e of snap.lineage.edges) {
    const from = layout.get(e.from);
    const to = layout.get(e.to);
    if (!from || !to) continue;
    const cp = bezierControl(from, to);
    const color =
      e.relation === "built-on" ? "rgba(124,92,255,0.55)" : e.relation === "inspired" ? "rgba(124,92,255,0.32)" : "rgba(138,147,166,0.25)";
    parts.push(
      `<path d="M ${tx(from.x).toFixed(1)} ${ty(from.y).toFixed(1)} Q ${tx(cp.x).toFixed(1)} ${ty(cp.y).toFixed(1)} ${tx(to.x).toFixed(1)} ${ty(to.y).toFixed(1)}" fill="none" stroke="${color}" stroke-width="${e.relation === "built-on" ? 1.6 : 1.1}"/>`,
    );
  }

  // nodes
  for (const [id, placed] of layout) {
    const node = snap.lineage.nodes.find((n) => n.id === id);
    if (!node) continue;
    const isSeed = node.kind === "seed";
    const isSelf = node.id === "deepseek-harness";
    const r = nodeRadius(node.stars, isSeed);
    const gs = r * 7 * scale;
    parts.push(
      `<circle cx="${tx(placed.x).toFixed(1)}" cy="${ty(placed.y).toFixed(1)}" r="${gs.toFixed(1)}" fill="url(#glowViolet)" opacity="${isSeed ? 0.9 : 0.55}"/>`,
    );
    parts.push(
      `<circle cx="${tx(placed.x).toFixed(1)}" cy="${ty(placed.y).toFixed(1)}" r="${(r * scale + 2).toFixed(1)}" fill="#12161F" stroke="${isSelf ? MINT : VIOLET}" stroke-width="${isSelf ? 2 : 1.3}"/>`,
    );
  }

  // labels
  for (const [id, placed] of layout) {
    const node = snap.lineage.nodes.find((n) => n.id === id);
    if (!node) continue;
    const r = nodeRadius(node.stars, node.kind === "seed");
    const isSelf = node.id === "deepseek-harness";
    const lx = tx(placed.x) + (r * scale + 2) + 9;
    const ly = ty(placed.y);
    const name = node.kind === "seed" ? "THE AGENT LOOP" : node.name;
    parts.push(
      `<text x="${lx.toFixed(1)}" y="${(ly - 6).toFixed(1)}" font-family="'JetBrains Mono',monospace" font-size="12" font-weight="600" fill="${INK}">${esc(name)}</text>`,
    );
    if (isSelf) {
      parts.push(
        `<text x="${lx.toFixed(1)}" y="${(ly + 9).toFixed(1)}" font-family="'JetBrains Mono',monospace" font-size="9.5" fill="${MINT}">⦿ renders this page</text>`,
      );
    } else if (node.stars != null) {
      parts.push(
        `<text x="${lx.toFixed(1)}" y="${(ly + 9).toFixed(1)}" font-family="'JetBrains Mono',monospace" font-size="9.5" fill="${DIM}">${Math.round(node.stars / 1000)}k★</text>`,
      );
    }
  }

  parts.push(
    `<text x="24" y="${H - 20}" font-family="'JetBrains Mono',monospace" font-size="11" fill="${DIM}">signal genome · lineage · generated from live data</text>`,
  );
  parts.push("</svg>");
  return parts.join("\n");
}

const isMain =
  process.argv[1] != null &&
  (process.argv[1].endsWith("snapshot.ts") || process.argv[1].endsWith("snapshot.mjs"));

if (isMain) {
  const snap = loadEcosystem();
  if (!snap) {
    console.error("[snapshot] no data — run `pnpm trends` first");
    process.exit(1);
  }
  const dataPath = findEcosystemDataPath();
  const out = dirname(dirname(dataPath)); // <root>
  const target = `${out}/docs/screenshots/lineage.svg`;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, renderSvg(snap));
  console.log(`[snapshot] wrote ${target}`);
}
