import { exec } from "node:child_process";

export type CommandResult = { ok: boolean; stdout: string; stderr: string; timedOut: boolean };

const DEFAULT_TIMEOUT_MS = Number(process.env.COLLECTOR_TIMEOUT_MS ?? 1_500_000);

export function bdata(
  args: string[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<CommandResult> {
  const command = `npx -p @brightdata/cli bdata ${args.map(shellQuote).join(" ")}`;
  return new Promise((resolve) => {
    let settled = false;
    const child = exec(
      command,
      { timeout: timeoutMs, maxBuffer: 256 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (settled) return;
        settled = true;
        resolve({
          ok: !error || (error as NodeJS.ErrnoException).code === undefined,
          stdout: stdout ?? "",
          stderr: stderr ?? "",
          timedOut: (error as NodeJS.ErrnoException)?.code === "ETIMEDOUT",
        });
      },
    );
    child.on("error", () => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, stdout: "", stderr: "failed to spawn npx", timedOut: false });
    });
  });
}

function shellQuote(arg: string): string {
  if (/^[a-zA-Z0-9_\-/.:=]+$/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '\\"')}"`;
}

export function parseCollectorId(text: string): string | null {
  const match = text.match(/c_[A-Za-z0-9]+/);
  return match ? match[0] : null;
}

export function lastLines(text: string, count: number): string {
  return text.trim().split(/\r?\n/).slice(-count).join("\n");
}
