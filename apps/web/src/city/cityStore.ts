import { create } from "zustand";
import { getCity, getTrends } from "../api.js";

export type RisingSignal = { geneId: string; label: string; deltaPct: number };

export type CityHealth = "healthy" | "healing" | "failed" | "stale";

export type CityBuilding = {
  id: string;
  title: string;
  source: string;
  sourceType: string;
  url: string;
  publishedAt: string | null;
  fetchedAt: number;
  excerpt: string;
  geneId: string;
  weight: number;
  importance: number;
  freshness: number;
  health: CityHealth;
  archived: boolean;
  kind?: "evidence" | "repository";
  org?: string;
  stars?: number;
  growth?: number;
  language?: string;
  bridge?: boolean;
  avenueSlot?: number;
};

export type CityDistrict = {
  id: string;
  label: string;
  family: string;
  color: string;
  maturity: "foundational" | "active" | "emerging";
  blurb: string;
  evidenceCount: number;
  momentum: number;
  recentCount: number;
  emerging: boolean;
  foundational: boolean;
  beacon: CityHealth;
};

export type CityRoad = {
  from: string;
  to: string;
  relationship: "prerequisite" | "related_to" | "fork_of" | "builds_on" | "integrates" | "reimplements";
  strength: number;
  kind: "concept" | "repo";
};
export type CityRouteStep = { geneId: string; label: string; blurb: string; depth: number };

export type CityModel = {
  domain: string;
  districts: CityDistrict[];
  buildings: CityBuilding[];
  roads: CityRoad[];
  stats: {
    totalItems: number;
    sourcesTotal: number;
    sourcesHealthy: number;
    sourcesHealing: number;
    sourcesBroken: number;
    lastCollectionAt: number | null;
    newThisWeek: number;
  };
  route: { geneId: string; headline: string; steps: CityRouteStep[] } | null;
  avenue: { ends: Array<{ id: string; label: string }>; bridges: Array<{ id: string; label: string }> };
};

type CityState = {
  model: CityModel | null;
  loading: boolean;
  scene: "arrival" | "overview";
  district: string | null;
  building: CityBuilding | null;
  hoverBuilding: string | null;
  at: number | null;
  playing: boolean;
  rising: RisingSignal[];
  load: (at?: number | null) => Promise<void>;
  loadRising: () => Promise<void>;
  enter: () => void;
  focusDistrict: (id: string | null) => void;
  selectBuilding: (b: CityBuilding | null) => void;
  setHoverBuilding: (id: string | null) => void;
  setAt: (at: number | null) => void;
  setPlaying: (playing: boolean) => void;
};

export const CITY_RANGE = {
  min: Date.parse("2023-06-01T00:00:00Z"),
  max: Date.now(),
};

const loadReq = { current: 0 };

export const useCity = create<CityState>((set, get) => ({
  model: null,
  loading: false,
  scene: "arrival",
  district: null,
  building: null,
  hoverBuilding: null,
  at: null,
  playing: false,
  rising: [],

  load: async (at) => {
    const effective = at === undefined ? get().at : at;
    const requestId = (loadReq.current += 1);
    set({ loading: true, at: effective });
    try {
      const param = effective ? `?at=${new Date(effective).toISOString()}` : "";
      const model = await getCity<CityModel>(`/city${param}`);
      if (loadReq.current === requestId) set({ model, loading: false });
    } catch {
      if (loadReq.current === requestId) set({ loading: false });
    }
  },

  loadRising: async () => {
    try {
      const trends = await getTrends<{ rising: RisingSignal[] }>();
      set({ rising: trends.rising });
    } catch {
      set({ rising: [] });
    }
  },

  enter: () => set({ scene: "overview", district: null, building: null }),

  focusDistrict: (id) => set({ district: id, building: null }),

  selectBuilding: (b) => set({ building: b }),

  setHoverBuilding: (id) => set({ hoverBuilding: id }),

  setAt: (at) => {
    set({ at });
    void get().load(at);
  },

  setPlaying: (playing) => set({ playing }),
}));

export function districtOf(model: CityModel | null, id: string | null): CityDistrict | null {
  if (!model || !id) return null;
  return model.districts.find((d) => d.id === id) ?? null;
}

export function buildingsOf(model: CityModel | null, geneId: string): CityBuilding[] {
  if (!model) return [];
  return model.buildings.filter((b) => b.geneId === geneId);
}

export function fmtCityDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function fmtMonth(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
