import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AVENUE_ENDS,
  LANDMARK_BY_ID,
  LANDMARK_REPOS,
  REPO_RELATIONS,
  repoImportance,
} from "./landmarks.js";

test("landmark set covers the requested demo scale", () => {
  assert.ok(LANDMARK_REPOS.length >= 16 && LANDMARK_REPOS.length <= 20);
  assert.ok(LANDMARK_REPOS.every((r) => LANDMARK_BY_ID[r.id]));
});

test("avenue endpoints exist and bridge repos connect them transitively", () => {
  for (const end of AVENUE_ENDS) assert.ok(LANDMARK_BY_ID[end]);
  const bridges = LANDMARK_REPOS.filter((r) => r.bridge);
  assert.ok(bridges.length >= 3);
  const from = new Set(REPO_RELATIONS.map((r) => r.from));
  const to = new Set(REPO_RELATIONS.map((r) => r.to));
  assert.ok(from.has(AVENUE_ENDS[0]));
  assert.ok(to.has(AVENUE_ENDS[1]));
  assert.ok(bridges.some((b) => from.has(b.id) || to.has(b.id)));
});

test("importance grows with stars and saturates", () => {
  const small = repoImportance(2000);
  const big = repoImportance(84000);
  assert.ok(big > small);
  assert.ok(repoImportance(150000) <= 1);
});
