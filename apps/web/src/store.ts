import { create } from "zustand";
import type {
  Direction,
  GeneDetail,
  GeneView,
  Genome,
  HealthRow,
  MutationNotice,
} from "./types.js";
import { getGene, getGenome, getHealth, postReaction, postVisit } from "./api.js";

export type Stage = "intro" | "live";
export type View = "tree" | "helix";

type GenomeStore = {
  stage: Stage;
  view: View;
  genome: Genome | null;
  selected: string | null;
  hovered: string | null;
  detail: GeneDetail | null;
  detailLoading: boolean;
  health: HealthRow[] | null;
  healthOpen: boolean;
  notices: MutationNotice[];
  connected: boolean;
  begin: () => void;
  setView: (view: View) => void;
  select: (geneId: string | null) => void;
  hover: (geneId: string | null) => void;
  react: (geneId: string, type: string) => void;
  refresh: () => Promise<void>;
  loadDetail: (geneId: string) => Promise<void>;
  openHealth: (open: boolean) => void;
  sse: (event: string, payload: unknown) => void;
};

const MAX_NOTICES = 6;

export const useGenome = create<GenomeStore>((set, get) => ({
  stage: "intro",
  view: "tree",
  genome: null,
  selected: null,
  hovered: null,
  detail: null,
  detailLoading: false,
  health: null,
  healthOpen: false,
  notices: [],
  connected: false,

  begin: () => {
    set({ stage: "live" });
    void postVisit().catch(() => {});
    void get().refresh();
  },

  setView: (view) => set({ view, healthOpen: false }),

  select: (geneId) => {
    set({ selected: geneId, healthOpen: false });
    if (geneId) void get().loadDetail(geneId);
    else set({ detail: null });
  },

  hover: (geneId) => set({ hovered: geneId }),

  react: (geneId, type) => {
    void postReaction(geneId, type).then(() => get().refresh());
  },

  refresh: async () => {
    try {
      const genome = await getGenome<Genome>();
      set({ genome });
      if (get().selected) void get().loadDetail(get().selected!);
    } catch {
      set({ connected: false });
    }
  },

  loadDetail: async (geneId) => {
    set({ detailLoading: true });
    try {
      const detail = await getGene<GeneDetail>(geneId);
      set({ detail, detailLoading: false });
    } catch {
      set({ detailLoading: false });
    }
  },

  openHealth: (open) => {
    set({ healthOpen: open, selected: null });
    if (open && !get().health) {
      void getHealth<HealthRow[]>()
        .then((health) => set({ health }))
        .catch(() => set({ health: [] }));
    }
  },

  sse: (event, payload) => {
    if (event === "hello") {
      set({ connected: true });
      return;
    }
    if (event === "genome" || event === "reaction") {
      void get().refresh();
      return;
    }
    if (event === "mutation") {
      const m = payload as MutationNotice;
      set({ notices: [m, ...get().notices].slice(0, MAX_NOTICES) });
      void get().refresh();
    }
  },
}));

export function subscribeSse(): () => void {
  const es = new EventSource("/api/events");
  const listener = (event: MessageEvent): void => {
    let payload: unknown;
    try {
      payload = JSON.parse(event.data);
    } catch {
      payload = {};
    }
    useGenome.getState().sse(event.type, payload);
  };
  es.addEventListener("hello", listener as EventListener);
  es.addEventListener("mutation", listener as EventListener);
  es.addEventListener("reaction", listener as EventListener);
  es.addEventListener("genome", listener as EventListener);
  es.onerror = (): void => {
    useGenome.setState({ connected: false });
  };
  return () => es.close();
}

export type { Direction, GeneView };
