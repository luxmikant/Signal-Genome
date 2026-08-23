import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GENE_FAMILIES } from "@signal/core";
import { GENES, GENE_BY_ID } from "@signal/genes";
import { computeStatsWithDates, normalizeMomentum } from "@signal/engine";
import { loadContents, loadReactions, loadTags } from "./db.js";
import { computeDirection } from "@signal/engine";

export type CityBuildingHealth = "healthy" | "healing" | "failed" | "stale";

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
  importance: number; // 0..1 — drives building height
  freshness: number; //  0..1 — drives window light (45-day decay)
  health: CityBuildingHealth;
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
  momentum: number; // 0..1
  recentCount: number;
  emerging: boolean;
  foundational: boolean;
  beacon: CityBuildingHealth;
};

export type CityRoad = {
  from: string;
  to: string;
  relationship: "prerequisite" | "related_to";
  strength: number;
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
};

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

type SourceState = {
  status: string;
  collectorId: string | null;
  lastCount: number | null;
  lastRunAt: number | null;
};

function loadSourceStates(): Map<string, SourceState> {
  const statePath = join(repoRoot, "config", "state.json");
  if (!existsSync(statePath)) return new Map();
  const raw = JSON.parse(readFileSync(statePath, "utf8")) as Record<string, SourceState>;
  return new Map(Object.entries(raw));
}

function healthFromStatus(status: string | undefined): CityBuildingHealth {
  switch (status) {
    case "healthy":
      return "healthy";
    case "healing":
    case "building":
      return "healing";
    case "broken":
      return "failed";
    default:
      return "stale";
  }
}

const DAY = 86_400_000;
const WEEK = 7 * DAY;

function prereqChain(geneId: string, acc: string[] = []): string[] {
  const gene = GENE_BY_ID[geneId];
  if (!gene) return acc;
  for (const p of gene.prerequisites ?? []) {
    if (!acc.includes(p)) {
      prereqChain(p, acc);
      acc.push(p);
    }
  }
  return acc;
}

export function buildCityModel(now: number = Date.now()): CityModel {
  const contents = loadContents();
  const tags = loadTags();
  const reactions = loadReactions();
  const sources = loadSourceStates();

  const items = contents
    .map((c) => ({
      id: c.id,
      geneIds: [...(tags.get(c.id)?.map((e) => e.geneId) ?? [])],
      publishedAt: c.publishedAt,
    }))
    .filter((c) => Date.parse(`${c.publishedAt}T00:00:00Z`) <= now);
  const stats = normalizeMomentum(computeStatsWithDates(items, now));

  const buildings: CityBuilding[] = [];
  const districts: CityDistrict[] = [];
  const atMs = now;

  for (const gene of GENES) {
    const geneStats = stats.get(gene.id);
    const edges = new Map(
      [...(tags?.entries() ?? [])]
        .filter(([, es]) => es.some((e) => e.geneId === gene.id))
        .map(([id, es]) => [id, es.find((e) => e.geneId === gene.id)!.weight] as const),
    );

    // buildings: most relevant items for this gene, built no later than `atMs`
    const buildingStart = buildings.length;
    const candidates = [...edges.entries()]
      .map(([id, weight]) => {
        const c = contents.find((x) => x.id === id);
        if (!c) return null;
        const published = new Date(`${c.publishedAt}T00:00:00Z`).getTime();
        if (Number.isNaN(published) || published > atMs) return null;
        const decay = Math.exp(-Math.max(0, atMs - published) / (45 * DAY));
        return { c, weight, decay };
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .sort((a, b) => b.weight * b.decay - a.weight * a.decay)
      .slice(0, 14);

    for (const { c, weight, decay } of candidates) {
      const health = healthFromStatus(sources.get(c.source)?.status);
      buildings.push({
        id: c.id,
        title: c.title,
        source: c.source,
        sourceType: c.sourceType,
        url: c.url,
        publishedAt: c.publishedAt,
        fetchedAt: 0,
        excerpt: c.body.slice(0, 240).replace(/\s+/g, " ").trim(),
        geneId: gene.id,
        weight,
        importance: Math.max(0.18, Math.min(1, 0.28 + (weight / 3) * 0.42 + decay * 0.5)),
        freshness: decay,
        health,
        archived: atMs - new Date(`${c.publishedAt}T00:00:00Z`).getTime() > 90 * DAY,
      });
    }

    // district beacon, item-weighted: a district goes dark only when most of
    // its evidence comes from failed sources; amber when any source is healing.
    const geneBuildings = buildings.slice(buildingStart);
    const failed = geneBuildings.filter((b) => b.health === "failed").length;
    const healthy = geneBuildings.filter((b) => b.health === "healthy").length;
    const healing = geneBuildings.filter((b) => b.health === "healing").length;
    const beacon: CityBuildingHealth =
      failed > healthy ? "failed" : healing > 0 ? "healing" : "healthy";

    districts.push({
      id: gene.id,
      label: gene.label,
      family: gene.family,
      color: GENE_FAMILIES[gene.family as keyof typeof GENE_FAMILIES]?.color ?? "#8a8c9b",
      maturity: gene.maturity,
      blurb: gene.blurb,
      evidenceCount: geneStats?.evidenceCount ?? 0,
      momentum: geneStats?.momentum ?? 0,
      recentCount: geneStats?.recentCount ?? 0,
      emerging: gene.maturity === "emerging",
      foundational: gene.maturity === "foundational",
      beacon,
    });
  }

  const roads: CityRoad[] = [];
  for (const gene of GENES) {
    for (const p of gene.prerequisites ?? []) {
      roads.push({ from: p, to: gene.id, relationship: "prerequisite", strength: 1 });
    }
  }

  const direction = computeDirection({ genes: GENES, contents, tags, reactions });
  const route = direction
    ? {
        geneId: direction.geneId,
        headline: direction.headline,
        steps: [...prereqChain(direction.geneId), direction.geneId].map((gid, depth) => ({
          geneId: gid,
          label: GENE_BY_ID[gid]?.label ?? gid,
          blurb: GENE_BY_ID[gid]?.blurb ?? "",
          depth,
        })),
      }
    : null;

  const newThisWeek = contents.filter((c) => {
    const published = new Date(`${c.publishedAt}T00:00:00Z`).getTime();
    return published > 0 && published <= atMs && atMs - published <= WEEK;
  }).length;

  let sourcesTotal = 0;
  let sourcesHealthy = 0;
  let sourcesHealing = 0;
  let sourcesBroken = 0;
  let lastCollectionAt: number | null = null;
  for (const st of sources.values()) {
    sourcesTotal += 1;
    if (st.status === "healthy") sourcesHealthy += 1;
    else if (st.status === "healing" || st.status === "building") sourcesHealing += 1;
    else if (st.status === "broken") sourcesBroken += 1;
    if (st.lastRunAt) lastCollectionAt = Math.max(lastCollectionAt ?? 0, st.lastRunAt);
  }

  return {
    domain: "Inference",
    districts,
    buildings,
    roads,
    stats: {
      totalItems: contents.length,
      sourcesTotal,
      sourcesHealthy,
      sourcesHealing,
      sourcesBroken,
      lastCollectionAt,
      newThisWeek,
    },
    route,
  };
}