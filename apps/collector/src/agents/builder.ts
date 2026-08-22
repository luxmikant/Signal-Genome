import { bdata, parseCollectorId, lastLines } from "../bdata.js";
import { patchState, type SourceConfig } from "../registry.js";

export async function buildCollector(source: SourceConfig): Promise<string | null> {
  console.log(`  [builder] asking Scraper Studio to build a collector for ${source.name}`);
  patchState(source.id, { status: "building" });

  const result = await bdata(["scraper", "create", source.url, source.prompt]);
  if (!result.ok) {
    console.error(
      `  [builder] failed to create collector: ${lastLines(result.stderr || result.stdout, 6)}`,
    );
    patchState(source.id, { status: "broken", lastError: "create failed" });
    return null;
  }

  const collectorId = parseCollectorId(result.stdout);
  if (!collectorId) {
    console.error(`  [builder] no collector id in output: ${lastLines(result.stdout, 8)}`);
    patchState(source.id, { status: "broken", lastError: "no collector id returned" });
    return null;
  }

  console.log(`  [builder] collector registered: ${collectorId}`);
  patchState(source.id, { collectorId, status: "unbuilt", lastError: null });
  return collectorId;
}
