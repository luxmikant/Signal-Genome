import { test } from "node:test";
import assert from "node:assert/strict";
import type { Content, Gene } from "@signal/core";
import { trendSeries } from "./trends.js";

const gene = (id: string, label: string): Gene => ({
  id, label, family: "memory", maturity: "active", blurb: "", aliases: [], keywords: [], prerequisites: [],
});

const content = (id: string, publishedAt: string, geneId: string): Content => ({
  id, source: "s", sourceType: "blog", title: id, url: `https://e.com/${id}`, publishedAt, body: id,
  codeBlocks: [], tags: [],
});

test("momentum decays with time and accumulates evidence", () => {
  const genes = [gene("kv-cache", "KV Cache")];
  const contents = [content("a", "2024-01-01", "kv-cache"), content("b", "2024-03-01", "kv-cache")];
  const tagMap = new Map(contents.map((c) => [c.id, [{ geneId: "kv-cache", weight: 1 }]]));

  const s = trendSeries({ genes, contents, tagMap, now: Date.parse("2024-05-01T00:00:00Z") });
  assert.equal(s.buckets[0], "2024-01");
  assert.ok(s.buckets.length >= 5);

  const m = s.momentumByGene["kv-cache"]!;
  const January = m[0]!;
  const March = m[2]!;
  const May = m[4]!;
  assert.ok(March > January);
  assert.ok(May < March, "momentum decays after the last evidence");
});

test("rising only reports genes with real quarter growth", () => {
  const quiet: Gene = gene("quiet", "Quiet");
  const fast: Gene = gene("fast", "Fast");
  const genes = [quiet, fast];
  const contents = [
    content("q1", "2023-11-01", "quiet"),
    content("f1", "2023-11-01", "fast"),
    content("f2", "2024-03-01", "fast"),
    content("f3", "2024-04-01", "fast"),
  ];
  const tagMap = new Map([
    ["q1", [{ geneId: "quiet", weight: 1 }]],
    ["f1", [{ geneId: "fast", weight: 1 }]],
    ["f2", [{ geneId: "fast", weight: 1 }]],
    ["f3", [{ geneId: "fast", weight: 1 }]],
  ]);
  const s = trendSeries({ genes, contents, tagMap, now: Date.parse("2024-05-01T00:00:00Z") });
  assert.ok(s.buckets.length >= 7);
  assert.ok(s.rising.some((r) => r.geneId === "fast"));
  assert.ok(!s.rising.some((r) => r.geneId === "quiet"));
});
