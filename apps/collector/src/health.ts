import { loadState } from "./registry.js";

export function sourceHealthTable(): Array<{
  id: string;
  status: string;
  latestRun: string;
  extracted: string;
  collectorId: string | null;
}> {
  const state = loadState();
  return Object.entries(state).map(([id, s]) => ({
    id,
    status: s.status,
    latestRun: s.lastRunAt ? new Date(s.lastRunAt).toISOString() : "never",
    extracted: s.lastCount !== null ? String(s.lastCount) : "—",
    collectorId: s.collectorId,
  }));
}
