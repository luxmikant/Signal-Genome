import { IngestBatchSchema, type Content } from "@signal/core";
import { GENES } from "@signal/genes";
import { tagContent } from "@signal/genes";
import { normalizeSourceItems } from "@signal/engine";
import { SEED_ITEMS } from "@signal/seed-content";
import {
  addReaction,
  db,
  getMeta,
  loadContents,
  loadReactions,
  loadTags,
  replaceTagsForContent,
  setMeta,
  upsertContent,
} from "./db.js";

export function seedGenome(): { items: number; tags: number } {
  const existing = new Set(loadContents().map((c) => c.id));
  let items = 0;
  let tags = 0;
  for (const item of SEED_ITEMS) {
    if (existing.has(item.id)) continue;
    if (!upsertContent(item)) continue;
    const edges = tagContent(item);
    replaceTagsForContent(item.id, edges);
    items += 1;
    tags += edges.length;
  }
  setMeta("seededAt", new Date().toISOString());
  return { items, tags };
}

export function ingestRaw(
  sourceId: string,
  raw: unknown,
  collectorId: string | null,
): { count: number; mutations: Array<Record<string, unknown>> } {
  const items = normalizeSourceItems(sourceId, raw);
  let count = 0;
  const mutations: Array<Record<string, unknown>> = [];
  const injected: Content[] = [];
  for (const item of items) {
    if (!upsertContent(item)) continue;
    const edges = tagContent(item);
    replaceTagsForContent(item.id, edges);
    count += 1;
    injected.push(item);
    mutations.push({
      contentId: item.id,
      geneIds: edges.map((e) => e.geneId),
      title: item.title,
      source: item.source,
      at: Date.now(),
    });
  }
  setMeta("lastCollector", collectorId ?? "seed");
  setMeta("lastIngestAt", String(Date.now()));
  return { count, mutations };
}

export function getGenomeState(): Record<string, unknown> {
  const contents = loadContents();
  const tags = loadTags();
  const reactions = loadReactions();
  const lastVisitAt = getMeta("lastVisitAt") ? Number(getMeta("lastVisitAt")) : null;
  return { contents, tags, reactions, lastVisitAt };
}

export function getGenes(): unknown[] {
  return GENES;
}

export function recordReaction(geneId: string, type: string): void {
  addReaction(geneId, type);
  db.prepare(
    "DELETE FROM reactions WHERE rowid NOT IN (SELECT rowid FROM reactions ORDER BY at DESC LIMIT 200)",
  ).run();
}

export function recordVisit(): void {
  setMeta("lastVisitAt", String(Date.now()));
}
