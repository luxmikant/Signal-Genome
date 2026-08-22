export const GENE_FAMILIES = {
  attention: { label: "Attention", color: "#22d3ee" },
  memory: { label: "Memory", color: "#fbbf24" },
  serving: { label: "Serving", color: "#34d399" },
  compute: { label: "Compute", color: "#a78bfa" },
  compression: { label: "Compression", color: "#fb7185" },
  routing: { label: "Routing", color: "#fb923c" },
  scale: { label: "Scale", color: "#38bdf8" },
  dynamics: { label: "Dynamics", color: "#a3e635" },
} as const;
export type GeneFamily = keyof typeof GENE_FAMILIES;

export const REACTION_WEIGHTS: Record<string, number> = {
  follow: 2,
  "teach-basics": 1.5,
  "already-know": -0.5,
  "not-for-me": -2,
};

export const REACTION_LABELS: Record<string, string> = {
  follow: "Follow this",
  "teach-basics": "Teach me the foundations",
  "already-know": "Already know this",
  "not-for-me": "Not for me",
};

export const MOMENTUM_HALF_LIFE_DAYS = 45;
export const RECENCY_WINDOW_DAYS = 30;
export const MUTATION_EVENT_TTL_MS = 60_000;
