import { loadState, patchState, SOURCE_BY_ID, SOURCES, type SourceConfig } from "./registry.js";
import { planAllSafe } from "./agents/planner.js";
import { buildCollector } from "./agents/builder.js";
import { runCollector } from "./agents/runner.js";
import { validateSource } from "./agents/validator.js";
import { healCollector } from "./agents/healer.js";
import { ingestBatch } from "./ingest.js";
import { loadSnapshot } from "./demo.js";

export type HarnessOptions = {
  concurrency: number;
  only?: string[];
  ingest: boolean;
  maxHealAttempts: number;
  noBData?: boolean;
};

export type HarnessReport = {
  processed: string[];
  healed: string[];
  failures: Array<{ source: string; message: string }>;
};

const HEAL_HEADER = "[HARNESS]======================================";

export async function runHarness(options: HarnessOptions): Promise<HarnessReport> {
  const report: HarnessReport = { processed: [], healed: [], failures: [] };
  const sources = SOURCES.filter((s) => !options.only || options.only.includes(s.id));

  console.log(HEAL_HEADER);
  console.log(`[harness] planning ${sources.length} sources at concurrency ${options.concurrency}`);

  const queue = [...sources];
  const results: Promise<void>[] = [];
  const workers = Array.from({ length: Math.max(1, options.concurrency) }, async () => {
    while (queue.length > 0) {
      const source = queue.shift();
      if (!source) return;
      const outcome = await processSource(source, options, report);
      if (!outcome.ok) report.failures.push({ source: source.id, message: outcome.message });
    }
  });
  await Promise.all(workers);

  console.log(HEAL_HEADER);
  console.log(`[harness] done: ${report.processed.length} runs, ${report.healed.length} heals, ${report.failures.length} failures`);
  return report;
}

async function processSource(
  source: SourceConfig,
  options: HarnessOptions,
  report: HarnessReport,
): Promise<{ ok: boolean; message: string }> {
  console.log(`\n[harness] › ${source.name} (${source.strategy})`);
  const states = loadState();
  const plan = planAllSafe(SOURCES, states);
  const decision = plan.find((p) => p.sourceId === source.id)!;

  if (decision.action === "idle" && options.only) {
    console.log(`  [harness] idle: ${decision.reason}`);
    return { ok: true, message: "idle" };
  }

  let collectorId = states[source.id]?.collectorId;
  if (!collectorId && !options.noBData) {
    collectorId = await buildCollector(source);
    if (!collectorId) return { ok: false, message: "collector build failed" };
  }
  if (!collectorId) {
    collectorId = `c_demo_${source.id}`;
    console.log(`  [harness] offline mode: demo collector ${collectorId} (no bdata calls)`);
  }

  return runLoop(
    source,
    collectorId,
    {
      noBData: options.noBData ?? false,
      attemptedHeals: 0,
      maxHeals: options.maxHealAttempts,
      ingest: options.ingest,
    },
    report,
  );
}

type LoopState = {
  noBData: boolean;
  attemptedHeals: number;
  maxHeals: number;
  ingest: boolean;
};

async function runLoop(
  source: SourceConfig,
  collectorId: string,
  loop: LoopState,
  report: HarnessReport,
): Promise<{ ok: boolean; message: string }> {
  const startedAt = Date.now();
  const state = loadState()[source.id];

  if (loop.noBData && state?.status === "broken") {
    console.log(`  [healer] offline-mode heal: same collector id ${collectorId}, same JSON schema — repairing…`);
    await new Promise((r) => setTimeout(r, 900));
    patchState(source.id, { status: "unbuilt", lastError: null, healCount: (state.healCount ?? 0) + 1 });
    report.healed.push(source.id);
    console.log(`  [healer] healed. re-running the exact same collector…`);
    return runLoop(source, collectorId, { ...loop, attemptedHeals: loop.attemptedHeals + 1 }, report);
  }

  if (loop.noBData) {
    const snapshot = loadSnapshot(source);
    if (!snapshot) {
      console.log(`  [harness] offline mode and no snapshot for ${source.id} — skips`);
      return { ok: true, message: "no offline snapshot" };
    }
    console.log(`  [runner] offline snapshot (${snapshot.kind}): ${source.id} via ${collectorId}`);
    const validation = validateSource(source, snapshot.raw);
    console.log(`  [validator] ${validation.status}: ${validation.itemCount} items`);
    if (validation.status === "healthy") {
      report.processed.push(source.id);
      patchState(source.id, { status: "healthy", lastRunAt: startedAt, lastCount: validation.itemCount, lastError: null });
      if (loop.ingest) await ingestBatch(collectorId, source, snapshot.raw);
      return { ok: true, message: "healthy (offline)" };
    }
    console.error(`  [validator] drift detected even in snapshot: ${validation.issues.join("; ")}`);
    return { ok: false, message: "snapshot invalid" };
  }

  const run = await runCollector(source, collectorId);
  if (!run.ok) {
    patchState(source.id, { status: "broken", lastError: run.error });
    return fallbackHeal(source, collectorId, loop, report);
  }
  const validation = validateSource(source, run.raw);
  console.log(`  [validator] ${validation.status}: ${validation.itemCount} items ${validation.issues.length ? `— ${validation.issues.join("; ")}` : ""}`);
  if (validation.status !== "healthy") {
    patchState(source.id, { status: "broken", lastError: validation.healHint });
    return fallbackHeal(source, collectorId, loop, report);
  }
  report.processed.push(source.id);
  patchState(source.id, { status: "healthy", lastRunAt: startedAt, lastCount: validation.itemCount, lastError: null });
  if (loop.ingest && run.raw) {
    await ingestBatch(loadState()[source.id]?.collectorId ?? collectorId, source, run.raw);
  }
  return { ok: true, message: "healthy" };
}

async function fallbackHeal(
  source: SourceConfig,
  collectorId: string,
  loop: LoopState,
  report: HarnessReport,
): Promise<{ ok: boolean; message: string }> {
  if (loop.attemptedHeals >= loop.maxHeals) {
    console.error(`  [harness] giving up on ${source.id} after ${loop.attemptedHeals} heal attempts`);
    return { ok: false, message: "unhealable" };
  }
  const hint = buildDriftHint(source);
  console.log(`  [validator] broken → dispatching to healer: "${hint.slice(0, 100)}…"`);

  const heal = await healCollector(source, collectorId, hint);
  if (!heal.ok) {
    patchState(source.id, { status: "broken", lastError: heal.output });
    return { ok: false, message: `heal failed: ${heal.output}` };
  }
  report.healed.push(source.id);
  return runLoop(source, collectorId, { ...loop, attemptedHeals: loop.attemptedHeals + 1 }, report);
}

function buildDriftHint(source: SourceConfig): string {
  return `The site changed its layout and the collector stopped returning "${source.expectedFields.join(", ")}" for its items. Please heal the extractor against the current structure so each item again returns: ${source.expectedFields.join(", ")}. Keep the JSON schema unchanged.`;
}

export function sourceFor(id: string): SourceConfig | undefined {
  return SOURCE_BY_ID[id];
}
