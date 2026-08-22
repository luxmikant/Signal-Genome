import type { SourceConfig } from "./registry.js";

const API_BASE = process.env.API_BASE ?? "http://localhost:8787";

export async function ingestBatch(
  collectorId: string,
  source: SourceConfig,
  raw: unknown,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/internal/ingest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceId: source.id, collectorId, items: raw }),
    });
    if (!res.ok) {
      console.error(`  [ingest] api rejected (${res.status})`);
      return false;
    }
    const body = (await res.json()) as { count: number };
    console.log(
      `  [ingest] ${body.count} normalized items → genome (via collector ${collectorId})`,
    );
    return true;
  } catch (err) {
    console.error(`  [ingest] api unreachable (${String(err)}) — data stays in data/raw/`);
    return false;
  }
}
