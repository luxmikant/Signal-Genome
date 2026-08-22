import { REACTION_WEIGHTS, REACTION_LABELS } from "@signal/core";
import type { Gene } from "@signal/genes";
import { GENE_BY_ID } from "@signal/genes";
import type { GeneStats } from "./fitness.js";

export type DirectionReason = { label: string; detail: string };

export type Direction = {
  geneId: string;
  headline: string;
  score: number;
  reasons: DirectionReason[];
};

type RankerInput = {
  genes: Gene[];
  stats: Map<string, GeneStats>;
  reactionsByGene: Map<string, number>;
  visitedIds: Set<string>;
  followedIds: Set<string>;
};

type Candidate = {
  geneId: string;
  prereqMissing: number;
  momentum: number;
  affinity: number;
  connectedNeighbors: number;
  score: number;
};

const W_PREREQ = 1.6;
const W_MOMENTUM = 1.2;
const W_AFFINITY = 1.0;
const W_CONNECTED = 0.8;

export function nextDirection(input: RankerInput): Direction | null {
  const { genes, stats, reactionsByGene, visitedIds, followedIds } = input;
  const maxMomentum = Math.max(0, ...[...stats.values()].map((s) => s.momentum));
  const maxConnected = Math.max(
    0,
    ...[...genes].map(
      (g) => g.prerequisites.length + g.prerequisites.filter((p) => followedIds.has(p)).length,
    ),
  );

  const candidates: Candidate[] = [];
  for (const gene of genes) {
    if (visitedIds.has(gene.id) || followedIds.has(gene.id)) continue;
    const prereqMissing = gene.prerequisites.filter(
      (p) => !visitedIds.has(p) && !followedIds.has(p),
    ).length;
    const momentum = (stats.get(gene.id)?.momentum ?? 0) / (maxMomentum || 1);
    const affinity = reactionsByGene.get(gene.id) ?? 0;
    const connectedNeighbors = gene.prerequisites.filter((p) => followedIds.has(p)).length;
    const connectedness = connectedNeighbors / (maxConnected || 1);
    const score =
      W_PREREQ * prereqMissing +
      W_MOMENTUM * momentum +
      W_AFFINITY * affinity +
      W_CONNECTED * connectedness;
    candidates.push({
      geneId: gene.id,
      prereqMissing,
      momentum,
      affinity,
      connectedNeighbors,
      score,
    });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0]!;
  const reasons = buildReasons(best, input);
  const gene = GENE_BY_ID[best.geneId]!;
  return {
    geneId: best.geneId,
    headline: `Learn ${gene.label} next`,
    score: Number(best.score.toFixed(2)),
    reasons,
  };
}

function buildReasons(best: Candidate, input: RankerInput): DirectionReason[] {
  const reasons: DirectionReason[] = [];
  const gene = GENE_BY_ID[best.geneId]!;
  const stats = input.stats.get(best.geneId);

  if (best.prereqMissing > 0) {
    const name = gene.prerequisites.find(
      (p) => !input.visitedIds.has(p) && !input.followedIds.has(p),
    );
    if (name) {
      const prereq = GENE_BY_ID[name];
      reasons.push({
        label: "Missing prerequisite",
        detail: `${prereq?.label ?? name} is the foundation you have not touched yet`,
      });
    }
  }
  if (best.momentum >= 0.75 && stats) {
    reasons.push({
      label: "High momentum",
      detail: `${stats.evidenceCount} sources, ${stats.recentCount} of them from the last month`,
    });
  }
  if (best.connectedNeighbors >= 1) {
    reasons.push({
      label: "Connects to what you follow",
      detail: `Shares prerequisite roots with ${best.connectedNeighbors} concept${best.connectedNeighbors === 1 ? "" : "s"} you follow`,
    });
  }
  const affinity = input.reactionsByGene.get(best.geneId) ?? 0;
  if (affinity > 0) {
    reasons.push({
      label: "Your signal says so",
      detail: `Your reaction history nudges this concept (${REACTION_LABELS[positiveReaction(affinity)] ?? "follow"})`,
    });
  }
  if (reasons.length === 0) {
    reasons.push({
      label: "Broadest gap",
      detail: "Highest combination of relevance and un-explored interest across your genome",
    });
  }
  return reasons.slice(0, 3);
}

function positiveReaction(value: number): string {
  return value >= 2 ? "follow" : "teach-basics";
}
