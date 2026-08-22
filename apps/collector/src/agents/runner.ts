import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bdata, lastLines } from "../bdata.js";
import { patchState, RAW_DIR, type SourceConfig } from "../registry.js";

export type RunOutcome = {
  ok: boolean;
  raw: unknown | null;
  error: string | null;
};

export async function runCollector(source: SourceConfig, collectorId: string, over: number = 0): Promise<RunOutcome> {
  console.log(`  [runner] executing collector ${collectorId} -> ${source.url}`);
  const result = await bdata(["scraper", "run", collectorId, source.url, "--pretty"]);

  if (!result.ok || !result.stdout.trim()) {
    patchState(source.id, {
      status: "broken",
      lastError: `run failed: ${lastLines(result.stderr || result.stdout, 4)}`,
    });
    return { ok: false, raw: null, error: result.stderr || "empty output" };
  }

  mkdirSync(join(RAW_DIR, source.id), { recursive: true });
  const file = join(RAW_DIR, source.id, `run-${Date.now()}.json`);
  writeFileSync(file, result.stdout.trim());

  let raw: unknown;
  try {
    const parsed = JSON.parse(result.stdout.trim());
    raw = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : parsed;
  } catch (err) {
    patchState(source.id, { status: "broken", lastError: "output is not JSON" });
    return { ok: false, raw: null, error: `not JSON: ${String(err)}` };
  }

  return { ok: true, raw, error: null };
}
