import { GENE_FAMILIES, type Content, type Gene, type Reaction } from "@signal/core";
import { GENE_BY_ID } from "@signal/genes";
import { computeStatsWithDates, maturityY, normalizeMomentum, type GeneStats } from "./fitness.js";
import { nextDirection } from "./ranker.js";

export type GeneView = {
  geneId: string;
  label: string;
  family: string;
  color: string;
  maturity: string;
  blurb: string;
  aliases: string[];
  prerequisites: string[];
  evidenceCount: number;
  momentum: number;
  recentCount: number;
  size: number;
  y: number;
  interest: number;
  hasPulse: boolean;
  followed: boolean;
  explored: boolean;
};

export type GenomeView = {
  genes: GeneView[];
  buildings: BuildingView[];
  totalItems: number;
  totalReactions: number;
  mutationCount: number;
  lastMutationAt: number | null;
  direction: {
    geneId: string;
    headline: string;
    reasons: Array<{ label: string; detail: string }>;
  } | null;
};

export type BuildingView = {
  id: string;
  title: string;
  source: string;
  sourceType: string;
  publishedAt: string;
  author: string | null;
  geneIds: string[];
  weight: number;
};

function tagMapOf(
  tags: Map<string, Array<{ geneId: string; weight: number }>>,
): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const [contentId, edges] of tags) {
    out.set(contentId, new Map(edges.map((e) => [e.geneId, e.weight])));
  }
  return out;
}

export function computeDirection(input: {
  genes: Gene[];
  contents: Content[];
  tags: Map<string, Array<{ geneId: string; weight: number }>>;
  reactions: Array<{ geneId: string; type: string; at: number }>;
}): ReturnType<typeof nextDirection> {
  const items = input.contents.map((c) => ({
    id: c.id,
    geneIds: [...(input.tags.get(c.id)?.map((e) => e.geneId) ?? [])],
    publishedAt: c.publishedAt,
  }));
  const stats = normalizeMomentum(computeStatsWithDates(items));
  const reactionTotals = new Map<string, number>();
  const visited = new Set<string>();
  const followed = new Set<string>();
  for (const r of input.reactions) {
    const weights: Record<string, number> = {
      follow: 2,
      "teach-basics": 1.5,
      "already-know": -0.5,
      "not-for-me": -2,
    };
    reactionTotals.set(r.geneId, (reactionTotals.get(r.geneId) ?? 0) + (weights[r.type] ?? 0));
    visited.add(r.geneId);
    if (r.type === "follow") followed.add(r.geneId);
  }
  return nextDirection({
    genes: input.genes,
    stats,
    reactionsByGene: reactionTotals,
    visitedIds: visited,
    followedIds: followed,
  });
}

export function buildGenomeView(params: {
  genes: Gene[];
  contents: Content[];
  tags: Map<string, Array<{ geneId: string; weight: number }>>;
  reactions: Reaction[];
  lastVisitAt: number | null;
  direction?: {
    geneId: string;
    headline: string;
    reasons: Array<{ label: string; detail: string }>;
  } | null;
}): GenomeView {
  const { genes, contents, tags, reactions, lastVisitAt } = params;
  const now = Date.now();

  const items = contents.map((c) => ({
    id: c.id,
    geneIds: [...(tagMapOf(tags).get(c.id)?.keys() ?? [])],
    publishedAt: c.publishedAt,
  }));
  const stats = normalizeMomentum(computeStatsWithDates(items, now));

  const followCounts = new Map<string, { follow: number; other: number; negative: number }>();
  const seen = new Set<string>();
  for (const reaction of reactions) {
    const bucket = followCounts.get(reaction.geneId) ?? { follow: 0, other: 0, negative: 0 };
    if (reaction.type === "follow") bucket.follow += 1;
    else if (reaction.type === "not-for-me") bucket.negative += 1;
    else bucket.other += 1;
    followCounts.set(reaction.geneId, bucket);
    seen.add(reaction.geneId);
  }

  const mutations = lastVisitAt
    ? contents.filter((c) => new Date(c.publishedAt).getTime() >= lastVisitAt - 86_400_000)
    : [];

  const views: GeneView[] = genes.map((gene) => {
    const statsFor = stats.get(gene.id);
    const bucket = followCounts.get(gene.id);
    const interest = bucket
      ? Math.min(3, bucket.follow * 2 + bucket.other * 1.5 - bucket.negative * 2)
      : 0;
    const isFollowed = !!bucket && bucket.follow > bucket.negative;
    return {
      geneId: gene.id,
      label: gene.label,
      family: gene.family,
      color: GENE_FAMILIES[gene.family as keyof typeof GENE_FAMILIES]?.color ?? "#94a3b8",
      maturity: gene.maturity,
      blurb: gene.blurb,
      aliases: gene.aliases,
      prerequisites: gene.prerequisites,
      evidenceCount: statsFor?.evidenceCount ?? 0,
      momentum: statsFor?.momentum ?? 0,
      recentCount: statsFor?.recentCount ?? 0,
      size: statsFor?.size ?? 0.7,
      y: maturityY(gene),
      interest,
      hasPulse: mutations.some((m) => {
        const edges = tags.get(m.id);
        return edges?.some((e) => e.geneId === gene.id) ?? false;
      }),
      followed: isFollowed,
      explored: seen.has(gene.id),
    };
  });

  const buildings: BuildingView[] = contents.map((c) => {
    const edges = tags.get(c.id) ?? [];
    return {
      id: c.id,
      title: c.title,
      source: c.source,
      sourceType: c.sourceType,
      publishedAt: c.publishedAt,
      author: c.author ?? null,
      geneIds: edges.map((e) => e.geneId),
      weight: Math.max(1, ...edges.map((e) => e.weight)),
    };
  });

  return {
    genes: views,
    buildings,
    totalItems: contents.length,
    totalReactions: reactions.length,
    mutationCount: mutations.length,
    lastMutationAt: lastVisitAt ?? null,
    direction: params.direction ?? computeDirection({ genes, contents, tags, reactions }),
  };
}

export function timelineForGene(
  geneId: string,
  contents: Content[],
  tags: Map<string, Array<{ geneId: string; weight: number }>>,
): Content[] {
  return contents
    .filter((c) => tags.get(c.id)?.some((e) => e.geneId === geneId))
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
    .reverse();
}

export function geneMeta(geneId: string): Gene | undefined {
  return GENE_BY_ID[geneId];
}
