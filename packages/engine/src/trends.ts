import { MOMENTUM_HALF_LIFE_DAYS, type Content, type Gene, type TagEdge } from "@signal/core";
import { publishedMs } from "./fitness.js";

const dayMs = 86_400_000;

export type TrendSeries = {
  buckets: string[];
  momentumByGene: Record<string, number[]>;
  countByGene: Record<string, number[]>;
  rising: Array<{ geneId: string; label: string; deltaPct: number }>;
  range: { min: string; max: string };
};

function monthKey(input: number): string {
  const d = new Date(input);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function firstOfMonth(key: string): number {
  const [y, m] = key.split("-").map(Number);
  return Date.UTC(y!, m! - 1, 1);
}

function addMonths(key: string, n: number): string {
  const d = new Date(firstOfMonth(key));
  d.setUTCMonth(d.getUTCMonth() + n);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function endOfMonthMs(key: string): number {
  return firstOfMonth(addMonths(key, 1)) - 1;
}

export function trendSeries(input: {
  genes: Gene[];
  contents: Content[];
  tagMap: Map<string, TagEdge[]>;
  now?: number;
}): TrendSeries {
  const { genes, contents, tagMap } = input;
  const now = input.now ?? Date.now();

  const dates = contents.map((c) => publishedMs(c.publishedAt)).filter((d) => d > 0);
  if (dates.length === 0) {
    return {
      buckets: [],
      momentumByGene: {},
      countByGene: {},
      rising: [],
      range: { min: "2023-01", max: monthKey(now) },
    };
  }

  const min = monthKey(Math.min(...dates));
  const max = monthKey(now);
  const buckets: string[] = [];
  for (let k = min; k <= max; k = addMonths(k, 1)) buckets.push(k);

  const momentumByGene: Record<string, number[]> = {};
  const countByGene: Record<string, number[]> = {};
  const itemsByGene = new Map<string, Array<{ at: number; weight: number }>>();

  for (const content of contents) {
    const at = publishedMs(content.publishedAt);
    if (at === 0) continue;
    for (const edge of tagMap.get(content.id) ?? []) {
      const list = itemsByGene.get(edge.geneId) ?? [];
      list.push({ at, weight: edge.weight });
      itemsByGene.set(edge.geneId, list);
    }
  }

  for (const gene of genes) {
    const items = itemsByGene.get(gene.id);
    const momentum: number[] = [];
    const counts: number[] = [];
    for (const bucket of buckets) {
      const end = endOfMonthMs(bucket);
      let m = 0;
      let c = 0;
      for (const item of items ?? []) {
        if (item.at > end) continue;
        const ageDays = Math.max(0, (end - item.at) / dayMs);
        m += item.weight * Math.exp(-ageDays / MOMENTUM_HALF_LIFE_DAYS);
        c += item.weight;
      }
      momentum.push(Number(m.toFixed(3)));
      counts.push(c);
    }
    momentumByGene[gene.id] = momentum;
    countByGene[gene.id] = counts;
  }

  return {
    buckets,
    momentumByGene,
    countByGene,
    rising: computeRising(genes, momentumByGene, countByGene),
    range: { min, max },
  };
}

function computeRising(
  genes: Gene[],
  momentumByGene: Record<string, number[]>,
  countByGene: Record<string, number[]>,
): Array<{ geneId: string; label: string; deltaPct: number }> {
  const out: Array<{ geneId: string; label: string; deltaPct: number }> = [];
  for (const gene of genes) {
    const m = momentumByGene[gene.id];
    const c = countByGene[gene.id];
    if (!m || !c || m.length < 7) continue;
    const latestCount = c[m.length - 1] ?? 0;
    if (latestCount < 3) continue;
    const recent = avgTail(m, 3);
    const prior = avgTail(m.slice(0, m.length - 3), 3);
    const deltaPct = Math.round(((recent - prior) / Math.max(prior, 0.05)) * 100);
    if (deltaPct >= 10) out.push({ geneId: gene.id, label: gene.label, deltaPct });
  }
  return out.sort((a, b) => b.deltaPct - a.deltaPct).slice(0, 3);
}

function avgTail(values: number[], n: number): number {
  const slice = values.slice(-n);
  if (slice.length === 0) return 0;
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}
