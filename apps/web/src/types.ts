export type GeneView = {
  geneId: string;
  label: string;
  family: string;
  color: string;
  maturity: "foundational" | "active" | "emerging";
  blurb: string;
  prerequisites: string[];
  evidenceCount: number;
  momentum: number;
  recentCount: number;
  size: number;
  y: number;
  interest: number;
  hasPulse: boolean;
  followed: boolean;
  explored: boolean;
};

export type Direction = {
  geneId: string;
  headline: string;
  score: number;
  reasons: Array<{ label: string; detail: string }>;
};

export type Genome = {
  genes: GeneView[];
  totalItems: number;
  totalReactions: number;
  mutationCount: number;
  lastMutationAt: number | null;
  direction: Direction | null;
};

export type GeneDetail = {
  gene: {
    id: string;
    label: string;
    family: string;
    maturity: string;
    blurb: string;
    prerequisites: string[];
  };
  total: number;
  timeline: Array<{
    id: string;
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    excerpt: string;
    tags: string[];
  }>;
};

export type HealthRow = {
  source: string;
  name: string;
  strategy: string;
  status: string;
  collectorId: string | null;
  lastCount: number | null;
  lastRunAt: number | null;
};

export type MutationNotice = {
  title: string;
  geneIds: string[];
  source: string;
  at: number;
};
