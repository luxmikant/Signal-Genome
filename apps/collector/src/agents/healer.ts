import { bdata, lastLines } from "../bdata.js";
import { loadState, patchState, type SourceConfig } from "../registry.js";

export type HealOutcome = { ok: boolean; collectorId: string | null; output: string };

export async function healCollector(source: SourceConfig, collectorId: string, description: string): Promise<HealOutcome> {
  console.log(`  [healer] describing the break to Scraper Studio (same collector ${collectorId})`);
  patchState(source.id, { status: "healing" });

  const result = await bdata(["scraper", "heal", collectorId, description]);

  if (!result.ok) {
    patchState(source.id, { status: "broken", lastError: `heal failed: ${lastLines(result.stderr || result.stdout, 4)}` });
    return { ok: false, collectorId, output: result.stderr || "heal failed" };
  }

  const healedId = collectorId;
  const prev = loadState()[source.id];
  patchState(source.id, { status: "unbuilt", lastError: null, healCount: (prev?.healCount ?? 0) + 1 });
  return { ok: true, collectorId: healedId, output: result.stdout };
}
