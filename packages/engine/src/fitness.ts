import { MOMENTUM_HALF_LIFE_DAYS, RECENCY_WINDOW_DAYS } from "@signal/core";
import type { Gene } from "@signal/genes";

export type GeneStats = {
  geneId: string;
  evidenceCount: number;
  evidenceIds: string[];
  momentum: number;
  recentCount: number;
  lastActiveAt: number;
  size: number;
};

const dayMs = 86_400_000;

export function publishedMs(dateStr: string): number {
  const t = new Date(`${dateStr}T00:00:00Z`).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function decayWeight(dateStr: string, now: number): number {
  const ageDays = Math.max(0, (now - publishedMs(dateStr)) / dayMs);
  return Math.exp(-ageDays / MOMENTUM_HALF_LIFE_DAYS);
}

export function computeStatsWithDates(
  items: Array<{ id: string; geneIds: string[]; publishedAt: string }>,
  now: number = Date.now(),
): Map<string, GeneStats> {
  const stats = new Map<string, GeneStats>();
  for (const item of items) {
    const weight = decayWeight(item.publishedAt, now);
    for (const geneId of item.geneIds) {
      const current = stats.get(geneId) ?? {
        geneId,
        evidenceCount: 0,
        evidenceIds: [],
        momentum: 0,
        recentCount: 0,
        lastActiveAt: 0,
        size: 0,
      };
      current.evidenceCount += 1;
      current.evidenceIds.push(item.id);
      current.momentum += weight;
      const ageDays = (now - publishedMs(item.publishedAt)) / dayMs;
      if (ageDays <= RECENCY_WINDOW_DAYS) current.recentCount += 1;
      current.lastActiveAt = Math.max(current.lastActiveAt, publishedMs(item.publishedAt));
      stats.set(geneId, current);
    }
  }
  for (const geneStats of stats.values()) {
    geneStats.size = 0.7 + Math.log1p(geneStats.evidenceCount) * 0.4;
  }
  return stats;
}

export function normalizeMomentum(stats: Map<string, GeneStats>): Map<string, GeneStats> {
  const max = Math.max(0, ...[...stats.values()].map((s) => s.momentum));
  if (max === 0) return stats;
  for (const s of stats.values()) s.momentum = s.momentum / max;
  return stats;
}

export function maturityY(gene: Gene): number {
  switch (gene.maturity) {
    case "foundational":
      return -0.9;
    case "active":
      return 0.1;
    case "emerging":
      return 0.95;
    default:
      return 0;
  }
}
