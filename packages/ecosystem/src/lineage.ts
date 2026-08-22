import type { EcoEdge, EcoNode } from "./types.js";

/**
 * Curated lineage of "harness engineering".
 *
 * Facts verified against GitHub API / primary sources (2026-08); where a fact
 * is from prior knowledge it is marked with a lower confidence and "(approx.)"
 * in the copy. Rerun `pnpm trends` to refresh stars from the live GitHub API.
 */

const seed: EcoNode = {
  id: "the-agent-loop",
  name: "The Agent Loop",
  org: null,
  kind: "seed",
  story:
    "Before any product: the idea that an autonomous agent could live in a loop — read code, plan, edit, run, iterate. It first became real projects in spring 2024.",
  dates: { born: "2024-03-01" },
  github: null,
  homepage: null,
  stars: null,
  starsUncertain: true,
  language: null,
  topics: ["agentic-coding", "autonomous-agents"],
  fingerprint: {},
  caps: { loop: 3, coding: 3 },
  drift: null,
  confidence: "medium",
  sources: [],
  closed: false,
  scraped: false,
  metrics: null,
};

const claudeCode: EcoNode = {
  id: "claude-code",
  name: "Claude Code",
  org: "Anthropic",
  kind: "project",
  story:
    "The idea becomes a product. Anthropic's terminal harness crystallized the agent loop — research preview Feb 2025, then GA with the Agent SDK. The ancestral tool every later one is measured against.",
  dates: { born: "2025-02-22" },
  github: "https://github.com/anthropics/claude-code",
  homepage: "https://www.anthropic.com/claude-code",
  stars: 142330,
  starsUncertain: false,
  language: "TypeScript",
  topics: ["agentic-coding", "cli", "harness"],
  fingerprint: {},
  caps: { loop: 3, terminal: 3, coding: 3, sdk: 1, plugins: 1, providers: 1 },
  drift: [
    { geneId: "terminal", delta: 3, note: "the loop becomes a terminal ritual — plan, edit, run, repeat" },
    { geneId: "sdk", delta: 1, note: "later opened up programmatically via the Agent SDK" },
  ],
  confidence: "high",
  sources: [
    "https://github.com/anthropics/claude-code",
    "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md",
  ],
  closed: false,
  scraped: false,
  metrics: null,
};

const openHands: EcoNode = {
  id: "openhands",
  name: "OpenHands",
  org: "All Hands AI",
  kind: "project",
  story:
    "The older wave: an autonomous software-engineering agent that pre-dates Claude Code by eleven months. Born OpenDevin, renamed OpenHands in mid-2024.",
  dates: {
    born: "2024-03-13",
    renames: [
      { from: "OpenDevin", to: "OpenHands", at: "2024-07-01", reason: "renamed ~Jul 2024 (approx.)" },
    ],
  },
  github: "https://github.com/All-Hands-AI/OpenHands",
  homepage: "https://www.all-hands.dev",
  stars: 84751,
  starsUncertain: false,
  language: "Python",
  topics: ["ai-agents", "software-engineering"],
  fingerprint: {},
  caps: { loop: 3, coding: 3, plugins: 2, sdk: 2, providers: 2, terminal: 1 },
  drift: [
    { geneId: "plugins", delta: 2, note: "the idea grows a platform: plugins, SDK, cloud sandboxes" },
    { geneId: "providers", delta: 2, note: "model-agnostic from the start" },
  ],
  confidence: "high",
  sources: ["https://github.com/All-Hands-AI/OpenHands"],
  closed: false,
  scraped: false,
  metrics: null,
};

const cline: EcoNode = {
  id: "cline",
  name: "Cline",
  org: "Cline",
  kind: "project",
  story:
    "Started life inside the IDE as 'Claude Dev' — then dropped the Claude name to become Cline, a model-agnostic agent for VS Code and JetBrains.",
  dates: {
    born: "2024-07-06",
    renames: [
      { from: "Claude Dev", to: "Cline", at: "2024-10-01", reason: "dropped the Claude name (approx.)" },
    ],
  },
  github: "https://github.com/cline/cline",
  homepage: "https://cline.bot",
  stars: 66632,
  starsUncertain: false,
  language: "TypeScript",
  topics: ["ai-agents", "vscode-extension", "coding-assistant"],
  fingerprint: {},
  caps: { coding: 3, loop: 2, providers: 2, plugins: 2, sdk: 1, terminal: 0 },
  drift: [
    { geneId: "providers", delta: 2, note: "one model's sidekick becomes a model-agnostic IDE agent" },
    { geneId: "loop", delta: -1, note: "shorter human-in-the-loop cycles inside the editor" },
  ],
  confidence: "high",
  sources: ["https://github.com/cline/cline"],
  closed: false,
  scraped: false,
  metrics: null,
};

const goose: EcoNode = {
  id: "goose",
  name: "Goose",
  org: "Block",
  kind: "project",
  story:
    "Block's extensible open-source agent: 'beyond code suggestions'. The same loop, rebuilt around an extension system.",
  dates: { born: "2024-08-23" },
  github: "https://github.com/block/goose",
  homepage: "https://block.github.io/goose/",
  stars: 53203,
  starsUncertain: false,
  language: "Rust",
  topics: ["ai-agents", "extensible"],
  fingerprint: {},
  caps: { loop: 2, coding: 2, plugins: 3, providers: 2, sdk: 2, terminal: 1 },
  drift: [
    { geneId: "plugins", delta: 3, note: "extensions become the point — the loop is a substrate" },
    { geneId: "loop", delta: -1, note: "autonomy traded for composability" },
  ],
  confidence: "high",
  sources: ["https://github.com/block/goose"],
  closed: false,
  scraped: false,
  metrics: null,
};

const agentSdk: EcoNode = {
  id: "claude-agent-sdk",
  name: "Claude Agent SDK",
  org: "Anthropic",
  kind: "project",
  story:
    "Anthropic opens the harness to programmers: the agent loop as a library instead of a terminal ritual.",
  dates: { born: "2025-09-27" },
  github: "https://github.com/anthropics/claude-agent-sdk-typescript",
  homepage: "https://docs.anthropic.com/en/docs/claude-code/sdk",
  stars: 1711,
  starsUncertain: false,
  language: "TypeScript",
  topics: ["sdk", "agentic-coding"],
  fingerprint: {},
  caps: { loop: 2, sdk: 3, coding: 2, plugins: 1, providers: 1, terminal: 0 },
  drift: [
    { geneId: "sdk", delta: 2, note: "the loop becomes a library — programmatic, not a ritual" },
    { geneId: "terminal", delta: -3, note: "no terminal needed; it lives inside your program" },
  ],
  confidence: "high",
  sources: ["https://github.com/anthropics/claude-agent-sdk-typescript"],
  closed: false,
  scraped: false,
  metrics: null,
};

const codex: EcoNode = {
  id: "codex",
  name: "Codex CLI",
  org: "OpenAI",
  kind: "project",
  story:
    "OpenAI's answer, born weeks after Claude Code's preview: a lightweight Rust coding agent for the terminal, local-first.",
  dates: { born: "2025-04-13" },
  github: "https://github.com/openai/codex",
  homepage: "https://github.com/openai/codex",
  stars: 111700,
  starsUncertain: false,
  language: "Rust",
  topics: ["cli", "coding-agent", "agentic-coding"],
  fingerprint: {},
  caps: { loop: 3, terminal: 3, coding: 3, sdk: 1, providers: 1, local: 1 },
  drift: [
    { geneId: "local", delta: 1, note: "same shape, different soul: Rust, local-first, OpenAI's own models" },
  ],
  confidence: "high",
  sources: ["https://github.com/openai/codex"],
  closed: false,
  scraped: false,
  metrics: null,
};

const geminiCli: EcoNode = {
  id: "gemini-cli",
  name: "Gemini CLI",
  org: "Google",
  kind: "project",
  story:
    "Google's open-source take on the same loop: terminal agent, Apache-2.0, Gemini models, extension points.",
  dates: { born: "2025-04-17" },
  github: "https://github.com/google-gemini/gemini-cli",
  homepage: "https://google-gemini.github.io/gemini-cli/",
  stars: 106609,
  starsUncertain: false,
  language: "TypeScript",
  topics: ["cli", "agentic-coding", "gemini"],
  fingerprint: {},
  caps: { loop: 3, terminal: 3, coding: 3, plugins: 2, providers: 1 },
  drift: [
    { geneId: "plugins", delta: 1, note: "the loop opens up: extensions where Claude Code had MCP" },
  ],
  confidence: "high",
  sources: ["https://github.com/google-gemini/gemini-cli"],
  closed: false,
  scraped: false,
  metrics: null,
};

const opencode: EcoNode = {
  id: "opencode",
  name: "OpenCode",
  org: "SST / Anomaly",
  kind: "project",
  story:
    "The client-driven terminal agent: any model, any provider, runs on your laptop. Started under the SST org.",
  dates: { born: "2025-04-30" },
  github: "https://github.com/anomalyco/opencode",
  homepage: "https://opencode.ai",
  stars: 200060,
  starsUncertain: false,
  language: "Go",
  topics: ["cli", "tui", "agentic-coding"],
  fingerprint: {},
  caps: { loop: 3, terminal: 2, coding: 3, providers: 2, plugins: 2, local: 1 },
  drift: [
    { geneId: "providers", delta: 1, note: "the model becomes a choice, not an identity" },
    { geneId: "local", delta: 1, note: "a TUI you can run on your own machine" },
  ],
  confidence: "medium",
  sources: ["https://github.com/anomalyco/opencode"],
  closed: false,
  scraped: false,
  metrics: null,
};

const openclaw: EcoNode = {
  id: "openclaw",
  name: "OpenClaw",
  org: "OpenClaw Foundation",
  kind: "project",
  story:
    "The wildest drift: @steipete wrapped Claude Code as a backend and exposed it over WhatsApp, Telegram and friends. Five names in ten weeks — Warelay, Clawdis, Clawdbot, Moltbot, OpenClaw — and it became the most-starred node in the family.",
  dates: {
    born: "2025-11-24",
    renames: [
      { from: "Warelay", to: "Clawdis", at: "2025-12-19", reason: "first rebrand, v2 beta" },
      { from: "Clawdis", to: "Clawdbot", at: "2026-01-05", reason: "the name that went viral" },
      { from: "Clawdbot", to: "Moltbot", at: "2026-01-27", reason: "legacy compatibility kept" },
      { from: "Moltbot", to: "OpenClaw", at: "2026-01-30", reason: "final name, OpenClaw Foundation" },
    ],
  },
  github: "https://github.com/openclaw/openclaw",
  homepage: "https://openclaw.ai",
  stars: 387064,
  starsUncertain: false,
  language: "TypeScript",
  topics: ["personal-ai-assistant", "gateway", "messaging"],
  fingerprint: {},
  caps: {
    loop: 2,
    terminal: 1,
    coding: 1,
    gateway: 3,
    providers: 3,
    plugins: 3,
    local: 2,
    desktop: 2,
  },
  drift: [
    { geneId: "gateway", delta: 3, note: "the harness leaves the terminal — it lives in your chats" },
    { geneId: "providers", delta: 2, note: "Claude, Pi, Codex, OpenCode… any agent as a pluggable backend" },
    { geneId: "coding", delta: -2, note: "it no longer codes for you; it orchestrates agents that do" },
  ],
  confidence: "high",
  sources: [
    "https://github.com/openclaw/openclaw",
    "https://raw.githubusercontent.com/openclaw/openclaw/main/VISION.md",
  ],
  closed: false,
  scraped: false,
  metrics: null,
};

const deepseekHarness: EcoNode = {
  id: "deepseek-harness",
  name: "DeepSeek Harness",
  org: "DeepSeek AI",
  kind: "project",
  story:
    "DeepSeek's own harness — 'everything is a plugin', built on Cordis. Brand-new, developer preview, and it is the harness behind the very interface you are looking at right now.",
  dates: { born: "2026-08-13" },
  github: "https://github.com/deepseek-ai/deepseek-harness",
  homepage: "https://deepseek.com/harness",
  stars: 182261,
  starsUncertain: false,
  language: "TypeScript",
  topics: ["agent-harness", "plugins", "cordis"],
  fingerprint: {},
  caps: {
    loop: 3,
    terminal: 1,
    coding: 1,
    gateway: 2,
    providers: 2,
    plugins: 3,
    sdk: 2,
  },
  drift: [
    { geneId: "plugins", delta: 2, note: "plugin-native via Cordis — the architecture IS the plugin system" },
    { geneId: "gateway", delta: 2, note: "a gateway-style harness, not just a coding loop" },
    { geneId: "coding", delta: -2, note: "the loop generalizes beyond code" },
  ],
  confidence: "high",
  sources: ["https://github.com/deepseek-ai/deepseek-harness", "https://deepseek.com/harness"],
  closed: false,
  scraped: false,
  metrics: null,
};

export const LINEAGE_NODES: EcoNode[] = [
  seed,
  openHands,
  cline,
  goose,
  claudeCode,
  agentSdk,
  codex,
  geminiCli,
  opencode,
  openclaw,
  deepseekHarness,
];

export const LINEAGE_EDGES: EcoEdge[] = [
  {
    from: "the-agent-loop",
    to: "openhands",
    relation: "inspired",
    note: "first wave — the idea becomes a real project",
    at: "2024-03-13",
    confidence: "high",
  },
  {
    from: "the-agent-loop",
    to: "cline",
    relation: "inspired",
    note: "the idea moves into the IDE",
    at: "2024-07-06",
    confidence: "high",
  },
  {
    from: "the-agent-loop",
    to: "goose",
    relation: "inspired",
    note: "the idea becomes an extension platform",
    at: "2024-08-23",
    confidence: "high",
  },
  {
    from: "the-agent-loop",
    to: "claude-code",
    relation: "built-on",
    note: "the idea crystallizes into the canonical harness",
    at: "2025-02-22",
    confidence: "high",
  },
  {
    from: "claude-code",
    to: "codex",
    relation: "competitor",
    note: "weeks after the preview went viral",
    at: "2025-04-13",
    confidence: "high",
  },
  {
    from: "claude-code",
    to: "gemini-cli",
    relation: "competitor",
    note: "same loop, Gemini models, Apache-2.0",
    at: "2025-04-17",
    confidence: "high",
  },
  {
    from: "claude-code",
    to: "opencode",
    relation: "competitor",
    note: "client-driven, any model, any provider",
    at: "2025-04-30",
    confidence: "medium",
  },
  {
    from: "claude-code",
    to: "claude-agent-sdk",
    relation: "built-on",
    note: "the harness opens up programmatically",
    at: "2025-09-27",
    confidence: "high",
  },
  {
    from: "claude-code",
    to: "openclaw",
    relation: "built-on",
    note: "Claude Code wrapped as a backend, exposed over messaging",
    at: "2025-11-24",
    confidence: "high",
  },
  {
    from: "claude-code",
    to: "deepseek-harness",
    relation: "inspired",
    note: "the same loop, re-shelled: plugin-native on Cordis",
    at: "2026-08-13",
    confidence: "high",
  },
];
