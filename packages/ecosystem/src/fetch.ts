import { fingerprintRepo } from "./fingerprint.js";
import type { EcoNode } from "./types.js";

/** Search queries that sample the AI-tool ecosystem (LLM inference + agents). */
export const ECOSYSTEM_QUERIES = [
  "topic:llm-inference",
  "topic:ai-agents",
  "topic:claude-code",
  "topic:inference-engine",
  "topic:agent-harness",
];

const PER_QUERY = 15;

type GhRepo = {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  pushed_at: string;
  homepage: string | null;
  archived: boolean;
};

async function searchRepos(q: string): Promise<GhRepo[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${PER_QUERY}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "signal-genome-ecosystem",
    },
  });
  if (!res.ok) {
    throw new Error(`github search failed for "${q}": ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { items: GhRepo[] };
  return body.items ?? [];
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(ms / 86_400_000, 1);
}

function toFieldNode(repo: GhRepo): EcoNode {
  const age = daysSince(repo.created_at);
  return {
    id: `gh:${repo.full_name}`,
    name: repo.full_name.split("/")[1] ?? repo.full_name,
    org: repo.full_name.split("/")[0] ?? null,
    kind: "project",
    story: repo.description ?? "",
    dates: { born: repo.created_at },
    github: repo.html_url,
    homepage: repo.homepage,
    stars: repo.stargazers_count,
    starsUncertain: false,
    language: repo.language,
    topics: repo.topics ?? [],
    fingerprint: fingerprintRepo({
      name: repo.full_name,
      description: repo.description,
      topics: repo.topics ?? [],
    }),
    drift: null,
    caps: {},
    confidence: "high",
    sources: [repo.html_url],
    closed: repo.archived,
    scraped: true,
    metrics: {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      starsPerDay: repo.stargazers_count / age,
      created: repo.created_at,
      pushed: repo.pushed_at,
    },
  };
}

export async function fetchField(): Promise<{
  field: EcoNode[];
  queries: Array<{ q: string; count: number }>;
}> {
  const byId = new Map<string, EcoNode>();
  const queries: Array<{ q: string; count: number }> = [];
  for (const q of ECOSYSTEM_QUERIES) {
    let count = 0;
    try {
      const repos = await searchRepos(q);
      for (const repo of repos) {
        const node = toFieldNode(repo);
        if (!byId.has(node.id)) byId.set(node.id, node);
      }
      count = repos.length;
    } catch (err) {
      console.warn(`[ecosystem] query "${q}" failed: ${(err as Error).message}`);
    }
    queries.push({ q, count });
  }
  const field = [...byId.values()].sort(
    (a, b) => (b.metrics?.stars ?? 0) - (a.metrics?.stars ?? 0),
  );
  return { field, queries };
}
