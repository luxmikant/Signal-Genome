import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fetchField } from "./fetch.js";
import { fingerprintRepo } from "./fingerprint.js";
import { LINEAGE_EDGES, LINEAGE_NODES } from "./lineage.js";
import { findEcosystemDataPath } from "./paths.js";
import type { EcoNode, EcoSnapshot } from "./types.js";

export const DATA_PATH = findEcosystemDataPath();

function githubFullName(url: string | null): string | null {
  if (!url) return null;
  const match = /github\.com\/([^/]+\/[^/]+)/i.exec(url);
  return match?.[1]?.toLowerCase() ?? null;
}

/** Merge curated lineage nodes with live scraped metrics where possible. */
function buildLineage(field: EcoNode[]): EcoNode[] {
  const byFullName = new Map(
    field.map((f) => [githubFullName(f.github), f] as [string | null, EcoNode]),
  );
  return LINEAGE_NODES.map((node) => {
    const live = byFullName.get(githubFullName(node.github));
    const fingerprint =
      Object.keys(node.fingerprint).length > 0
        ? node.fingerprint
        : fingerprintRepo({
            name: `${node.org ?? ""} ${node.name}`,
            description: node.story,
            topics: node.topics,
          });
    return {
      ...node,
      fingerprint,
      stars: live?.metrics?.stars ?? node.stars,
      starsUncertain: !live && node.starsUncertain,
      metrics: live?.metrics ?? null,
    };
  });
}

async function main(): Promise<void> {
  const previous = existsSync(DATA_PATH)
    ? (JSON.parse(readFileSync(DATA_PATH, "utf8")) as EcoSnapshot)
    : null;

  let field: EcoNode[] = [];
  let queries: Array<{ q: string; count: number }> = [];
  let fetchedAt = new Date().toISOString();
  let stale = false;

  try {
    const result = await fetchField();
    field = result.field;
    queries = result.queries;
  } catch (err) {
    console.warn(`[ecosystem] GitHub unreachable (${(err as Error).message}) — keeping cached field data`);
    field = previous?.field ?? [];
    queries = previous?.queries ?? [];
    fetchedAt = previous?.fetchedAt ?? fetchedAt;
    stale = true;
  }

  const lineageNodes = buildLineage(field);
  // Keep the field cloud distinct from the curated lineage tree.
  const lineageGithubs = new Set(
    lineageNodes.map((n) => githubFullName(n.github)).filter((n): n is string => !!n),
  );
  const fieldFiltered = field.filter((f) => {
    const full = githubFullName(f.github);
    return !full || !lineageGithubs.has(full);
  });

  const snapshot: EcoSnapshot = {
    fetchedAt,
    lineage: { nodes: lineageNodes, edges: LINEAGE_EDGES },
    field: fieldFiltered,
    queries,
  };

  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(snapshot, null, 2));
  console.log(
    `[ecosystem] wrote ${DATA_PATH}: ` +
      `${lineageNodes.length} lineage nodes, ${fieldFiltered.length} field repos` +
      (stale ? " (stale cache)" : ""),
  );
  const top = [...fieldFiltered]
    .sort((a, b) => (b.metrics?.starsPerDay ?? 0) - (a.metrics?.starsPerDay ?? 0))
    .slice(0, 10);
  for (const t of top) {
    console.log(
      `  ${String(t.metrics?.stars ?? 0).padStart(7)} ★  +${(t.metrics?.starsPerDay ?? 0).toFixed(1)}/day  ${t.github}`,
    );
  }
}

main().catch((err) => {
  console.error("[ecosystem] failed:", err);
  process.exit(1);
});
