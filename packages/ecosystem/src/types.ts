export type NodeKind =
  | "seed" // the original idea / first mover
  | "project" // a descendant project
  | "rename" // a rename of an existing project
  | "competitor"; // parallel lineage, not a descendant

export type Confidence = "high" | "medium" | "low" | "unverified";

export type EcoNode = {
  id: string;
  name: string;
  org: string | null;
  kind: NodeKind;
  /** 1-2 sentence narrative shown in the journey */
  story: string;
  dates: {
    born: string; // ISO date
    renames?: Array<{ from: string; to: string; at: string; reason: string }>;
  };
  github: string | null;
  homepage: string | null;
  stars: number | null;
  /** true when stars come from curation, not a live scrape */
  starsUncertain: boolean;
  language: string | null;
  topics: string[];
  /** geneId -> tagger weight 0..3; the node's conceptual fingerprint */
  fingerprint: Record<string, number>;
  /** capability axis -> level 0..3 (curated for lineage nodes, empty for field) */
  caps: Record<string, number>;
  /** how this node drifted from its parent (delta = child - parent) */
  drift: Array<{ geneId: string; delta: number; note: string }> | null;
  confidence: Confidence;
  sources: string[];
  closed: boolean;
  scraped: boolean;
  /** live metrics for scraped nodes (or lineage nodes merged with a live repo) */
  metrics: {
    stars: number;
    forks: number;
    starsPerDay: number;
    created: string;
    pushed: string;
  } | null;
};

export type EcoEdge = {
  from: string;
  to: string;
  relation: "renamed" | "built-on" | "inspired" | "competitor";
  note: string;
  at: string; // ISO date
  confidence: Confidence;
};

export type EcoSnapshot = {
  fetchedAt: string;
  lineage: { nodes: EcoNode[]; edges: EcoEdge[] };
  field: EcoNode[];
  queries: Array<{ q: string; count: number }>;
};
