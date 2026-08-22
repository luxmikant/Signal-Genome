import type { Content } from "@signal/core";
import { tagContent } from "@signal/genes";

/**
 * Score a repository against the canonical gene registry using the same
 * tagger that scores scraped content. A repo's fingerprint is derived from
 * its name, description and topics — so drift between a project and its
 * ancestor can be expressed in the same units as the rest of Signal Genome.
 */
export function fingerprintRepo(input: {
  name: string;
  description: string | null;
  topics: string[];
}): Record<string, number> {
  const text = [input.name, input.description ?? "", ...input.topics].join(" ").toLowerCase();
  const synthetic: Content = {
    id: `eco:${input.name}`,
    source: "ecosystem",
    sourceType: "community",
    title: `${input.name} ${input.description ?? ""}`,
    url: "",
    publishedAt: new Date().toISOString(),
    body: text,
    codeBlocks: [],
    tags: input.topics,
  };
  const edges = tagContent(synthetic);
  const out: Record<string, number> = {};
  for (const edge of edges) {
    out[edge.geneId] = edge.weight;
  }
  return out;
}

/** geneId -> weight deltas (child minus parent) */
export function driftBetween(
  child: Record<string, number>,
  parent: Record<string, number>,
): Array<{ geneId: string; delta: number }> {
  const keys = new Set([...Object.keys(child), ...Object.keys(parent)]);
  const out: Array<{ geneId: string; delta: number }> = [];
  for (const key of keys) {
    const delta = (child[key] ?? 0) - (parent[key] ?? 0);
    if (delta !== 0) out.push({ geneId: key, delta });
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
