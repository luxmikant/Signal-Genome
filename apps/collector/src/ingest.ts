import type { SourceConfig } from "./registry.js";

const API_BASE = process.env.API_BASE ?? "http://localhost:8787";
const CHUNK_SIZE = 25;

async function postBatch(payload: unknown): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/internal/ingest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`  [ingest] api rejected (${res.status})`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`  [ingest] api unreachable (${String(err)}) — data stays in data/raw/`);
    return false;
  }
}

export async function ingestBatch(
  collectorId: string,
  source: SourceConfig,
  raw: unknown,
): Promise<boolean> {
  const items = Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown })?.data) ? (raw as { data: unknown[] }).data : [raw];
  let okCount = 0;
  let failed = false;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const ok = await postBatch({ sourceId: source.id, collectorId, items: chunk });
    if (ok) {
      okCount += chunk.length;
      if (i === 0) console.log(`  [ingest] sending ${items.length} items in chunks of ${CHUNK_SIZE}…`);
    } else {
      failed = true;
      break;
    }
  }
  if (!failed && okCount > 0) {
    console.log(`  [ingest] ${okCount} normalized items → genome (via collector ${collectorId})`);
  }
  return !failed;
}
