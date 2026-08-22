export type TreeNodeRef = { id: string; born: string };
export type TreeEdgeRef = { from: string; to: string };

export type PlacedNode = {
  id: string;
  depth: number;
  angle: number; // radians; 0 = +x, y grows downward on screen
  radius: number;
  x: number;
  y: number;
};

/** World-space radius of one tree ring. */
export const RING = 180;

/**
 * Radial phylogenetic layout. The root sits at the origin; every node gets an
 * angular sector proportional to the number of leaves in its subtree, so a
 * branch that "exploded" (many descendants) visually dominates the circle.
 * Children are ordered by birth date inside their parent's sector.
 */
export function computeTreeLayout(
  nodes: TreeNodeRef[],
  edges: TreeEdgeRef[],
): Map<string, PlacedNode> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();
  for (const e of edges) {
    const list = children.get(e.from) ?? [];
    list.push(e.to);
    children.set(e.from, list);
    hasParent.add(e.to);
  }
  const roots = nodes.filter((n) => !hasParent.has(n.id));
  const place = new Map<string, PlacedNode>();

  const leafCount = (id: string): number => {
    const kids = children.get(id) ?? [];
    if (kids.length === 0) return 1;
    return kids.reduce((sum, k) => sum + leafCount(k), 0);
  };

  const assign = (id: string, depth: number, start: number, end: number): void => {
    const angle = (start + end) / 2;
    const radius = depth * RING;
    place.set(id, {
      id,
      depth,
      angle,
      radius,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
    const kids = (children.get(id) ?? [])
      .slice()
      .sort((a, b) => (byId.get(a)?.born ?? "").localeCompare(byId.get(b)?.born ?? ""));
    const totalLeaves = kids.reduce((sum, k) => sum + leafCount(k), 0) || 1;
    let cursor = start;
    for (const kid of kids) {
      const share = ((end - start) * leafCount(kid)) / totalLeaves;
      assign(kid, depth + 1, cursor, cursor + share);
      cursor += share;
    }
  };

  for (const root of roots) {
    assign(root.id, 0, -Math.PI / 2, Math.PI * 1.5);
  }
  return place;
}

/** Bezier control point for the parent->child edge: pulls toward the parent's angle. */
export function bezierControl(a: PlacedNode, b: PlacedNode): { x: number; y: number } {
  const midR = (a.radius + b.radius) / 2;
  return { x: Math.cos(a.angle) * midR, y: Math.sin(a.angle) * midR };
}

/** Golden-angle slot on a softly eccentric ring — for the scraped "field" cloud. */
export function fieldSlot(index: number, radius: number): { x: number; y: number } {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const angle = index * golden;
  const hash = (index * 2654435761) % 97;
  const jitter = 0.9 + (0.2 * hash) / 97;
  const r = radius * jitter;
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r * 0.8 };
}
