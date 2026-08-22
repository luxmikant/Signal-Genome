import { test } from "node:test";
import assert from "node:assert/strict";
import type { Content } from "@signal/core";
import { tagContent } from "./tagger.js";

function item(partial: Partial<Content>): Content {
  return {
    id: "test::1",
    source: "test",
    sourceType: "blog",
    title: "x",
    url: "https://example.com/x",
    publishedAt: "2026-01-01",
    body: "",
    codeBlocks: [],
    tags: [],
    ...partial,
  };
}

test("tags a vLLM paged attention post from body", () => {
  const c = item({ body: "we integrated paged attention into our kv cache block table allocator" });
  const edges = tagContent(c);
  assert.ok(edges.some((e) => e.geneId === "paged-attention"));
  assert.ok(edges.some((e) => e.geneId === "kv-cache" || e.geneId === "serving-frameworks"));
});

test("gives identity-precision weight over body", () => {
  const c = item({ title: "PagedAttention in vLLM", body: "tokens" });
  const edges = tagContent(c);
  const pa = edges.find((e) => e.geneId === "paged-attention");
  assert.equal(pa?.weight, 3);
});

test("does not match short alias inside unrelated word", () => {
  const c = item({ body: "the network top would not work without setup" });
  const edges = tagContent(c);
  assert.ok(!edges.some((e) => e.geneId === "tensor-parallelism"));
});

test("tags framework names", () => {
  const c = item({ body: "we run SGLang and llama.cpp side by side" });
  const edges = tagContent(c);
  assert.ok(edges.some((e) => e.geneId === "serving-frameworks"));
});

test("tags hyphenated variant in code block at code weight", () => {
  const c = item({ body: "simple", codeBlocks: ["engine.batch(speculative-decoding)"] });
  const edges = tagContent(c);
  const sd = edges.find((e) => e.geneId === "speculative-decoding");
  assert.equal(sd?.weight, 1.5);
});
