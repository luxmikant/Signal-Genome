import { create } from "zustand";
import type { EcoEdge, EcoNode, EcoSnapshot } from "@signal/ecosystem";
import { getEcosystem } from "../api.js";

export type CamTarget = { x: number; y: number; scale: number };

type EcoState = {
  data: EcoSnapshot | null;
  loading: boolean;
  error: string | null;
  hoverId: string | null;
  hoverPos: { x: number; y: number } | null;
  focusId: string | null;
  chapter: number;
  scrubT: number | null;
  maxT: number;
  load: () => Promise<void>;
  setHover: (id: string | null, pos?: { x: number; y: number }) => void;
  focus: (id: string | null) => void;
  setChapter: (n: number) => void;
  setScrubT: (t: number | null) => void;
};

export const useEco = create<EcoState>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  hoverId: null,
  hoverPos: null,
  focusId: null,
  chapter: 0,
  scrubT: null,
  maxT: Date.now(),

  load: async () => {
    if (get().data || get().loading) return;
    set({ loading: true });
    try {
      const data = await getEcosystem<EcoSnapshot>();
      const maxT = Math.max(
        ...data.lineage.nodes.map((n) => new Date(n.dates.born).getTime()),
      );
      set({ data, maxT, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  setHover: (id, pos) => set({ hoverId: id, hoverPos: pos ?? null }),

  focus: (id) => set({ focusId: id }),

  setChapter: (n) => set({ chapter: n }),

  setScrubT: (t) => set({ scrubT: t }),
}));

// ---------- pure helpers ----------

export function nodeById(snap: EcoSnapshot | null, id: string | null): EcoNode | null {
  if (!snap || !id) return null;
  return snap.lineage.nodes.find((n) => n.id === id) ?? snap.field.find((n) => n.id === id) ?? null;
}

export function lineageById(snap: EcoSnapshot, id: string): EcoNode | undefined {
  return snap.lineage.nodes.find((n) => n.id === id);
}

export function parentEdgeOf(snap: EcoSnapshot, id: string): EcoEdge | null {
  return snap.lineage.edges.find((e) => e.to === id) ?? null;
}

/** ids from root down to (and including) the node. */
export function pathToRoot(snap: EcoSnapshot, id: string): string[] {
  const path: string[] = [];
  let cursor: string | undefined = id;
  while (cursor) {
    path.unshift(cursor);
    cursor = snap.lineage.edges.find((e) => e.to === cursor)?.from;
  }
  return path;
}

/** Top field repos by star velocity (stars/day). */
export function hotField(snap: EcoSnapshot, limit = 8): EcoNode[] {
  return [...snap.field]
    .filter((n) => n.metrics)
    .sort((a, b) => (b.metrics?.starsPerDay ?? 0) - (a.metrics?.starsPerDay ?? 0))
    .slice(0, limit);
}

export function fmtStars(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

const CAP_LABELS: Record<string, string> = {
  loop: "agent loop",
  terminal: "terminal",
  gateway: "gateway",
  providers: "multi-provider",
  plugins: "plugins",
  sdk: "SDK",
  coding: "coding",
  local: "local-first",
  desktop: "companion apps",
};

export function capLabel(cap: string): string {
  return CAP_LABELS[cap] ?? cap;
}
