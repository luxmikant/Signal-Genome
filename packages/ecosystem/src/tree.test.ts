import assert from "node:assert/strict";
import { test } from "node:test";
import { RING, bezierControl, computeTreeLayout, fieldSlot } from "./tree.js";

test("root sits at the origin", () => {
  const place = computeTreeLayout(
    [{ id: "root", born: "2024-01-01" }],
    [],
  );
  const root = place.get("root")!;
  assert.equal(root.depth, 0);
  assert.equal(root.x, 0);
  assert.equal(root.y, 0);
});

test("children land on the next ring, ordered by birth", () => {
  const place = computeTreeLayout(
    [
      { id: "root", born: "2024-01-01" },
      { id: "b", born: "2024-03-01" },
      { id: "a", born: "2024-02-01" },
    ],
    [
      { from: "root", to: "a" },
      { from: "root", to: "b" },
    ],
  );
  const a = place.get("a")!;
  const b = place.get("b")!;
  assert.equal(a.depth, 1);
  assert.equal(b.depth, 1);
  assert.ok(Math.abs(Math.hypot(a.x, a.y) - RING) < 1e-6);
  // sector order follows birth date: a (Feb) starts before b (Mar) => angle(a) < angle(b)
  assert.ok(a.angle < b.angle);
});

test("a branch with many leaves claims a wider sector", () => {
  const nodes = [
    { id: "root", born: "2024-01-01" },
    { id: "big", born: "2024-02-01" },
    { id: "small", born: "2024-03-01" },
    { id: "leaf1", born: "2024-04-01" },
    { id: "leaf2", born: "2024-05-01" },
    { id: "leaf3", born: "2024-06-01" },
  ];
  const edges = [
    { from: "root", to: "big" },
    { from: "root", to: "small" },
    { from: "big", to: "leaf1" },
    { from: "big", to: "leaf2" },
    { from: "big", to: "leaf3" },
  ];
  const place = computeTreeLayout(nodes, edges);
  const total = Math.PI * 2;
  // big subtree: 3 leaves; small: 1 leaf -> sector ratio 3:1.
  const bigShare = (3 / 4) * total;
  const smallShare = (1 / 4) * total;
  const midBig = -Math.PI / 2 + bigShare / 2;
  const midSmall = -Math.PI / 2 + bigShare + smallShare / 2;
  assert.ok(Math.abs(place.get("big")!.angle - midBig) < 1e-6);
  assert.ok(Math.abs(place.get("small")!.angle - midSmall) < 1e-6);
  assert.equal(place.get("leaf1")!.depth, 2);
});

test("field slots stay near the ring and are distinct", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 60; i++) {
    const { x, y } = fieldSlot(i, 500);
    const r = Math.hypot(x, y);
    assert.ok(r > 500 * 0.72 && r < 500 * 1.11, `slot ${i} radius ${r}`);
    const key = `${x.toFixed(3)},${y.toFixed(3)}`;
    assert.ok(!seen.has(key), `slot ${i} collides`);
    seen.add(key);
  }
});

test("bezier control pulls toward the parent angle", () => {
  const a = { id: "a", depth: 0, angle: 0, radius: 0, x: 0, y: 0 };
  const b = { id: "b", depth: 1, angle: Math.PI / 2, radius: RING, x: 0, y: RING };
  const c = bezierControl(a, b);
  assert.ok(c.x > 0 && c.x < RING); // control on the parent-angle ray (+x)
  assert.ok(Math.abs(c.y) < 1e-6);
});
