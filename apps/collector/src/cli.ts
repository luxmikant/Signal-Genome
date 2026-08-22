import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadState, patchState, RAW_DIR, SOURCE_BY_ID, SOURCES } from "./registry.js";
import { runHarness } from "./harness.js";

const CMD = process.argv[2] ?? "harness";
const rest = process.argv.slice(3);
const flag = (name: string) => rest.includes(name);
function valueOf(name: string): string | undefined {
  const idx = rest.indexOf(name);
  return idx >= 0 && idx + 1 < rest.length ? rest[idx + 1] : undefined;
}

function main(): void {
  switch (CMD) {
    case "create":
    case "run":
    case "heal":
      console.log(`single-command flows use: pnpm > ${CMD} <source-id>  — or start from the harness with pnpm harness`);
      console.log("available sources:", SOURCES.map((s) => s.id).join(", "));
      break;
    case "harness": {
      const only = valueOf("--source") ? [valueOf("--source")!] : undefined;
      if (only) console.log(`[cli] scoping to: ${only.join(", ")}`);
      void runHarness({
        concurrency: Number(process.env.COLLECTOR_CONCURRENCY ?? 2),
        only,
        ingest: !flag("--no-ingest"),
        maxHealAttempts: flag("--no-heal") ? 0 : 2,
        noBData: flag("--offline"),
      }).then((report) => {
        const failed = report.failures.length > 0 ? `\n[cli] failures: ${report.failures.map((f) => `${f.source} (${f.message})`).join("; ")}` : "";
        process.stdout.write(`[cli] harness finished: ${report.processed.length} healthy, ${report.healed.length} healed${failed}\n`);
      });
      break;
    }
    case "health": {
      const state = loadState();
      console.table(
        SOURCES.map((s) => {
          const st = state[s.id];
          return {
            source: s.id,
            status: st?.status ?? "unbuilt",
            collector: st?.collectorId ?? "—",
            lastRun: st?.lastRunAt ? new Date(st.lastRunAt).toLocaleString() : "—",
            lastCount: st?.lastCount ?? "—",
          };
        }),
      );
      break;
    }
    case "demo-break": {
      const target = valueOf("--source") ?? "vllm-docs";
      if (!SOURCE_BY_ID[target]) {
        console.error(`[demo] unknown source ${target}`);
        process.exit(1);
      }
      patchState(target, {
        status: "broken",
        lastError: "validator: layout drift — site moved article content into a main-content section; body coverage 0.00",
      });
      writeFileSync(
        join(RAW_DIR, `${target}.drift-notes.json`),
        JSON.stringify({ detectedAt: new Date().toISOString(), target, schema: SOURCE_BY_ID[target]!.expectedFields }, null, 2),
      );
      console.log(`[demo] simulated layout change for ${target}`);
      console.log(`[demo] next: pnpm heal ${target}   (or: pnpm harness)  to watch the loop repair it`);
      break;
    }
    default:
      console.log("usage: pnpm harness | pnpm health | pnpm demo:break --source <id>");
  }
}

main();
