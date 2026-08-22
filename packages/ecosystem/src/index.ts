import { existsSync, readFileSync } from "node:fs";
import { findEcosystemDataPath } from "./paths.js";
import type { EcoEdge, EcoNode, EcoSnapshot } from "./types.js";

export type { Confidence, EcoEdge, EcoNode, EcoSnapshot } from "./types.js";
export * from "./tree.js";

export const DATA_PATH = findEcosystemDataPath();

export function loadEcosystem(): EcoSnapshot | null {
  if (!existsSync(DATA_PATH)) return null;
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf8")) as EcoSnapshot;
  } catch {
    return null;
  }
}

/** Top repos across lineage + field by star velocity. */
export function trendLeaders(snapshot: EcoSnapshot, limit = 10): EcoNode[] {
  const all = [...snapshot.lineage.nodes, ...snapshot.field];
  return all
    .filter((n) => n.metrics)
    .sort((a, b) => (b.metrics?.starsPerDay ?? 0) - (a.metrics?.starsPerDay ?? 0))
    .slice(0, limit);
}
