import { test } from "node:test";
import assert from "node:assert/strict";
import type { Content } from "@signal/core";
import type { Gene } from "@signal/genes";
import { buildGenomeView } from "./genome.js";
import { nextDirection } from "./ranker.js";
import { computeStatsWithDates, maturityY } from "./fitness.js";

const gene = (id: string, prereqs: string[] = []): Gene => ({
  id, label: id, family: "attention", maturity: "active", blurb: "", aliases: [], keywords: [], prerequisites: prereqs,
});

const content = (id: string, publishedAt: string): Content => ({
  id, source: "s", sourceType: "blog", title: id, url: `https://e.com/${id}`, publishedAt, body: id, codeBlocks: [], tags: [],
});

function tagsFor(map: Record<string, string[]>): Map<string, Array<{ geneId: string; weight: number }>> {
  return new Map(Object.entries(map).map(([k, v]) => [k, v.map((geneId) => ({ geneId, weight: 1 }))]));
}

test("rankers picks un-explored gene with missing prerequisites", () => {
  const genes = [gene("attention"), gene("kv-cache", ["attention"]), gene("emitting", ["attention"])];
  const stats = computeStatsWithDates([
    { id: "a", geneIds: ["attention"], publishedAt: "2026-01-01" },
    { id: "b", geneIds: ["emitting"], publishedAt: "2026-01-01" },
  ], Date.parse("2026-06-01T00:00:00Z"));
  const d = nextDirection({
    genes,
    stats,
    reactionsByGene: new Map(),
    visitedIds: new Set(),
    followedIds: new Set(["emitting"]),
  });
  assert.equal(d?.geneId, "kv-cache");
  assert.ok(d?.reasons.some((r) => r.label === "Missing prerequisite"));
});

test("reaction affinity is reflected in reasons", () => {
  const genes = [gene("attention"), gene("flashattention", ["attention"])];
  const stats = computeStatsWithDates([], Date.now());
  const d = nextDirection({
    genes,
    stats,
    reactionsByGene: new Map([["flashattention", 2]]),
    visitedIds: new Set(["attention"]),
    followedIds: new Set(),
  });
  assert.equal(d?.geneId, "flashattention");
});

test("genome view computes pulse for items newer than last visit", () => {
  const genes = [gene("attention")];
  const contents = [
    content("old", "2026-01-01"),
    content("new", "2026-08-10"),
  ];
  const { genes: views } = buildGenomeView({
    genes,
    contents,
    tags: tagsFor({ old: ["attention"], new: ["attention"] }),
    reactions: [],
    lastVisitAt: Date.parse("2026-08-01T00:00:00Z"),
    direction: null,
  });
  assert.equal(views[0]?.hasPulse, true);
});

test("maturity maps to vertical axis order", () => {
  const foundational = gene("found", []); foundational.maturity = "foundational";
  const emerging = gene("emerge", []); emerging.maturity = "emerging";
  assert.ok(maturityY(emerging) > maturityY(foundational));
});
