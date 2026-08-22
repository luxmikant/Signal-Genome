import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type SourceConfig = {
  id: string;
  name: string;
  url: string;
  strategy: "sitemap" | "discovery";
  prompt: string;
  expectedFields: string[];
  minItems: number;
};

export type SourceState = {
  collectorId: string | null;
  status: "unbuilt" | "building" | "healthy" | "healing" | "broken";
  lastRunAt: number | null;
  lastCount: number | null;
  lastError: string | null;
  healCount: number;
};

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const CONFIG_DIR = join(root, "config");
export const RAW_DIR = join(root, "data", "raw");

export const SOURCES: SourceConfig[] = [
  {
    id: "vllm-docs",
    name: "vLLM Docs",
    url: "https://docs.vllm.ai",
    strategy: "sitemap",
    prompt:
      "Extract every documentation page. For each page return: title, page_url, publication date if present, body (markdown content), and code_blocks (list of code snippets). Keep slugs from the sitemap as the stable page identifier.",
    expectedFields: ["title", "url", "body"],
    minItems: 8,
  },
  {
    id: "unsloth-blog",
    name: "Unsloth Blog",
    url: "https://unsloth.ai/blog",
    strategy: "discovery",
    prompt:
      "Discover recent blog articles. Return a list of the last 20 posts. For each post return: title, url, published_at, author, body (article text), code_blocks (python snippets), and tags.",
    expectedFields: ["title", "url", "body"],
    minItems: 5,
  },
  {
    id: "modal-blog",
    name: "Modal Blog",
    url: "https://modal.com/blog",
    strategy: "discovery",
    prompt:
      "Discover recent technical blog articles. For each post return: title, url, published_at, author, body (article text), code_blocks, and tags.",
    expectedFields: ["title", "url", "body"],
    minItems: 5,
  },
  {
    id: "anyscale-blog",
    name: "Anyscale Blog",
    url: "https://www.anyscale.com/blog",
    strategy: "discovery",
    prompt:
      "Discover recent technical blog articles. For each post return: title, url, published_at, author, body (article text), code_blocks, and tags.",
    expectedFields: ["title", "url", "body"],
    minItems: 5,
  },
];

export const SOURCE_BY_ID: Record<string, SourceConfig> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
);

export function loadState(): Record<string, SourceState> {
  const path = join(CONFIG_DIR, "state.json");
  if (!existsSync(path)) writeState({});
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeState(next: Record<string, SourceState>): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(join(CONFIG_DIR, "state.json"), JSON.stringify(next, null, 2));
}

export function writeSourcesFile(): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(join(CONFIG_DIR, "sources.json"), JSON.stringify(SOURCES, null, 2));
}

export function patchState(id: string, patch: Partial<SourceState>): SourceState {
  const state = loadState();
  const prev = state[id] ?? {
    collectorId: null,
    status: "unbuilt" as const,
    lastRunAt: null,
    lastCount: null,
    lastError: null,
    healCount: 0,
  };
  state[id] = { ...prev, ...patch };
  writeState(state);
  return state[id];
}
