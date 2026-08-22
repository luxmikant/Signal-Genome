import { create } from "zustand";
import { getCity } from "../api.js";

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

export type CityRoad = { from: string; to: string; relationship: "prerequisite" | "related_to"; strength: number };
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
};

type CityState = {
  model: CityModel | null;
  loading: boolean;
  scene: "arrival" | "overview";
  district: string | null;
  building: CityBuilding | null;
  hoverBuilding: string | null;
  load: () => Promise<void>;
  enter: () => void;
  focusDistrict: (id: string | null) => void;
  selectBuilding: (b: CityBuilding | null) => void;
  setHoverBuilding: (id: string | null) => void;
};

export const useCity = create<CityState>((set, get) => ({
  model: null,
  loading: false,
  scene: "arrival",
  district: null,
  building: null,
  hoverBuilding: null,

  load: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const model = await getCity<CityModel>();
      set({ model, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  enter: () => set({ scene: "overview", district: null, building: null }),

  focusDistrict: (id) =>
    set((s) => ({
      district: id,
      building: null,
      scene: "overview",
      ...(s.scene === "arrival" ? {} : {}),
    })),

  selectBuilding: (b) => set({ building: b }),

  setHoverBuilding: (id) => set({ hoverBuilding: id }),
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