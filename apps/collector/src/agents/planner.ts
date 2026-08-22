import type { SourceConfig, SourceState } from "../registry.js";

export type PlanEntry = {
  sourceId: string;
  action: "create" | "run" | "heal" | "idle";
  reason: string;
};

export function planEntry(source: SourceConfig, state: SourceState, now: number): PlanEntry {
  const staleAt = 1000 * 60 * 60 * 36;
  if (!state.collectorId) {
    return { sourceId: source.id, action: "create", reason: "no collector registered yet" };
  }
  if (state.status === "broken") {
    return {
      sourceId: source.id,
      action: "heal",
      reason: `validator flagged drift: ${state.lastError ?? "unknown"}`,
    };
  }
  if (state.status === "healing") {
    return { sourceId: source.id, action: "run", reason: "post-heal re-run" };
  }
  if (state.status === "unbuilt") {
    return {
      sourceId: source.id,
      action: "run",
      reason: `registered collector ${state.collectorId}, first run`,
    };
  }
  if (!state.lastRunAt || now - state.lastRunAt > staleAt) {
    return {
      sourceId: source.id,
      action: "run",
      reason: `stale (last run ${new Date(state.lastRunAt as number).toISOString()})`,
    };
  }
  return { sourceId: source.id, action: "idle", reason: "fresh and healthy" };
}

export function planAllSafe(
  sources: SourceConfig[],
  states: Record<string, SourceState>,
  now: number = Date.now(),
): PlanEntry[] {
  return sources.map((s) => planEntry(s, states[s.id] ?? ({} as SourceState), now));
}
