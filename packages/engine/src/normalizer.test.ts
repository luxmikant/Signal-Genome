import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSourceItems } from "./normalizer.js";

test("normalizes a discovery-style collection", () => {
  const raw = [
    { title: "Guide to KV caching", url: "https://modal.com/blog/kv?utm=1", published_at: "2026-05-01", body: "text", tags: ["LLM"] },
    { title: "Serving at scale", url: "https://modal.com/blog/serving", date: "2026-06-01", content: "other" },
  ];
  const out = normalizeSourceItems("modal-blog", raw, Date.parse("2026-08-01T00:00:00Z"));
  assert.equal(out.length, 2);
  assert.equal(out[0]?.source, "modal-blog");
  assert.equal(out[0]?.sourceType, "blog");
  assert.equal(out[0]?.tags.join(","), "LLM");
});

test("cleans tracking params from urls and dedupes by id", () => {
  const raw = [
    { title: "A", url: "https://anyscale.com/blog/a?utm_source=twitter", date: "2026-01-01", body: "x" },
    { title: "A", url: "https://anyscale.com/blog/a?utm_source=linkedin", date: "2026-01-01", body: "x" },
  ];
  const out = normalizeSourceItems("anyscale-blog", raw);
  assert.equal(out[0]?.url, "https://anyscale.com/blog/a");
  assert.equal(out[0]?.id, out[1]?.id);
});

test("dots objects without url or title", () => {
  const out = normalizeSourceItems("unsloth-blog", [{ body: "orphan" }, "string", 42]);
  assert.equal(out.length, 0);
});

test("uses fetched time when no date exists", () => {
  const out = normalizeSourceItems("vllm-docs", [{ title: "page", url: "https://docs.vllm.ai/x", body: "b" }], Date.parse("2026-08-20T00:00:00Z"));
  assert.equal(out[0]?.publishedAt, "2026-08-20");
});
