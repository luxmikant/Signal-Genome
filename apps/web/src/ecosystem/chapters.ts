import type { PlacedNode } from "@signal/ecosystem/tree";
import type { CamTarget } from "./ecoStore.js";

export type Chapter = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  facts: Array<{ k: string; v: string }>;
  /** lineage nodes this chapter frames (empty = whole tree) */
  nodeIds: string[];
};

export const CHAPTERS: Chapter[] = [
  {
    id: "overview",
    kicker: "signal genome · lineage",
    title: "One idea became a family.",
    body: "Every tool in this tree descends — by fork, rename, or inspiration — from a single thought: an agent that lives in a loop, reading, editing and running code. Scroll to follow the drift.",
    facts: [
      { k: "lineage", v: "11 nodes" },
      { k: "field", v: "66 repos · live" },
      { k: "window", v: "2024-03 → 2026-08" },
    ],
    nodeIds: [],
  },
  {
    id: "the-seed",
    kicker: "2024 · the idea",
    title: "The loop before the tools.",
    body: "Before any product, a pattern: autonomous agents that plan, act, and iterate. The seed is abstract — it has no repo and no stars. It only has descendants.",
    facts: [
      { k: "status", v: "pure idea" },
      { k: "evidence", v: "3 first-wave projects" },
    ],
    nodeIds: ["the-agent-loop"],
  },
  {
    id: "first-wave",
    kicker: "spring 2024 · first wave",
    title: "Three takes on autonomy.",
    body: "OpenHands built a platform around the loop. Cline slipped it inside the IDE — it was born 'Claude Dev'. Goose rebuilt it as an extension substrate. Same seed, three drifts.",
    facts: [
      { k: "openhands", v: "ex-OpenDevin" },
      { k: "cline", v: "ex-Claude Dev" },
      { k: "goose", v: "Block" },
    ],
    nodeIds: ["openhands", "cline", "goose"],
  },
  {
    id: "crystallization",
    kicker: "feb 2025 · the moment",
    title: "Claude Code crystallizes the loop.",
    body: "Anthropic's research preview turned the idea into a ritual — plan, edit, run, repeat. It became the canonical harness, and every later terminal agent is measured against it.",
    facts: [
      { k: "born", v: "2025-02-22" },
      { k: "stars", v: "~142k" },
      { k: "role", v: "the ancestor" },
    ],
    nodeIds: ["claude-code"],
  },
  {
    id: "fork-storm",
    kicker: "apr–sep 2025 · the storm",
    title: "A storm of forks and rivals.",
    body: "Within weeks of the preview: Codex CLI, Gemini CLI, OpenCode. By autumn Anthropic opened the loop itself — the Agent SDK, a harness you can call from your own program.",
    facts: [
      { k: "codex", v: "+111k ★" },
      { k: "opencode", v: "+200k ★" },
      { k: "sdk", v: "the loop as a library" },
    ],
    nodeIds: ["codex", "gemini-cli", "opencode", "claude-agent-sdk"],
  },
  {
    id: "wildest-drift",
    kicker: "nov 2025 · the wildest drift",
    title: "Five names in ten weeks.",
    body: "@steipete wrapped Claude Code as a backend and put the harness in your chats. Warelay → Clawdis → Clawdbot → Moltbot → OpenClaw — and the rename chaos became the family's biggest star.",
    facts: [
      { k: "stars", v: "~387k" },
      { k: "renames", v: "4 in 67 days" },
      { k: "shape", v: "gateway, not terminal" },
    ],
    nodeIds: ["openclaw"],
  },
  {
    id: "newest-branch",
    kicker: "aug 2026 · the newest branch",
    title: "The harness that renders this page.",
    body: "DeepSeek's own answer: everything is a plugin, built on Cordis. It is days old, a developer preview — and it is the harness behind the very interface you are looking at right now.",
    facts: [
      { k: "born", v: "2026-08-13" },
      { k: "stars", v: "~182k in 9 days" },
      { k: "self", v: "renders this page" },
    ],
    nodeIds: ["deepseek-harness"],
  },
  {
    id: "whole-family",
    kicker: "2024 → 2026 · the whole family",
    title: "Watch the idea propagate.",
    body: "Every node lights in birth order — two and a half years of drift in twenty seconds. The dust outside the rings is the wider field: repos scraped live from GitHub, sized by star velocity.",
    facts: [
      { k: "scrub", v: "auto-playing" },
      { k: "field", v: "hover the dust" },
    ],
    nodeIds: [],
  },
];

/**
 * Camera target for a chapter: centroid of the framed nodes, zoom chosen so
 * the whole arc fits on screen with breathing room.
 */
export function camForChapter(
  chapter: Chapter,
  layout: Map<string, PlacedNode>,
  viewW: number,
  viewH: number,
): CamTarget {
  if (chapter.nodeIds.length === 0) {
    return { x: 0, y: 0, scale: Math.min(viewW, viewH) / 1350 };
  }
  const positions = chapter.nodeIds
    .map((id) => layout.get(id))
    .filter((p): p is PlacedNode => !!p);
  if (positions.length === 0) return { x: 0, y: 0, scale: 0.6 };
  const cx = positions.reduce((s, p) => s + p.x, 0) / positions.length;
  const cy = positions.reduce((s, p) => s + p.y, 0) / positions.length;
  const spread = Math.max(
    ...positions.map((p) => Math.hypot(p.x - cx, p.y - cy)),
    140,
  );
  const scale = Math.min(viewW, viewH) / (spread * 2.9);
  return { x: cx, y: cy, scale: Math.max(0.42, Math.min(scale, 1.7)) };
}
