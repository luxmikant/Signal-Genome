import { cpSync, existsSync, mkdirSync, readdirSync, symlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url).replace(/\\/g, "/"));
const spaceRoot = join(root, "..");
const packagesDir = join(spaceRoot, "packages");
const targetRoot = join(spaceRoot, "node_modules", "@signal");

mkdirSync(targetRoot, { recursive: true });

// pnpm owns the workspace links: it junctions node_modules/@signal/<name>
// -> packages/<name> at install time. We only fill gaps (bare checkout before
// `pnpm install`). Prefer a junction; when the platform or sandbox refuses to
// create reparse points (some Windows setups fail with EISDIR/EPERM), fall
// back to a real-directory copy so dev/typecheck keep working everywhere.
for (const name of readdirSync(packagesDir)) {
  const target = join(targetRoot, name);
  if (existsSync(target)) {
    console.log(`synced @signal/${name} (present)`);
    continue;
  }
  const src = join(packagesDir, name);
  try {
    const type = process.platform === "win32" ? "junction" : "dir";
    symlinkSync(src, target, type);
    console.log(`synced @signal/${name} (junction)`);
  } catch (err) {
    cpSync(src, target, { recursive: true });
    const code = err && typeof err === "object" ? err.code ?? err.message : String(err);
    console.log(`synced @signal/${name} (copy fallback: ${code})`);
  }
}
