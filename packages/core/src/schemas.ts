import { z } from "zod";

export const SOURCE_TYPES = ["blog", "docs", "changelog", "community"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const GENE_MATURITY = ["foundational", "active", "emerging"] as const;
export type GeneMaturity = (typeof GENE_MATURITY)[number];

export const REACTION_TYPES = ["follow", "already-know", "teach-basics", "not-for-me"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export const SOURCE_STATUSES = ["unbuilt", "building", "healthy", "healing", "broken"] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

export const ContentSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceType: z.enum(SOURCE_TYPES),
  title: z.string(),
  url: z.string().url(),
  publishedAt: z.string(),
  author: z.string().optional(),
  body: z.string(),
  codeBlocks: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});
export type Content = z.infer<typeof ContentSchema>;

export const GeneSchema = z.object({
  id: z.string(),
  label: z.string(),
  family: z.string(),
  maturity: z.enum(GENE_MATURITY),
  blurb: z.string(),
  aliases: z.array(z.string()),
  keywords: z.array(z.string()),
  prerequisites: z.array(z.string()),
});
export type Gene = z.infer<typeof GeneSchema>;

export const ReactionSchema = z.object({
  geneId: z.string(),
  type: z.enum(REACTION_TYPES),
  at: z.number(),
});
export type Reaction = z.infer<typeof ReactionSchema>;

export const SourceHealthSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  strategy: z.enum(["sitemap", "discovery"]),
  status: z.enum(SOURCE_STATUSES),
  collectorId: z.string().nullable(),
  lastRunAt: z.number().nullable(),
  lastCount: z.number().nullable(),
  driftNote: z.string().nullable(),
});
export type SourceHealth = z.infer<typeof SourceHealthSchema>;

export const TagEdgeSchema = z.object({
  geneId: z.string(),
  weight: z.number().positive(),
});
export type TagEdge = z.infer<typeof TagEdgeSchema>;

export const MutationEventSchema = z.object({
  contentId: z.string(),
  geneIds: z.array(z.string()),
  title: z.string(),
  source: z.string(),
  at: z.number(),
});
export type MutationEvent = z.infer<typeof MutationEventSchema>;

export const IngestBatchSchema = z.object({
  sourceId: z.string(),
  items: z.array(z.unknown()),
});
export type IngestBatch = z.infer<typeof IngestBatchSchema>;
