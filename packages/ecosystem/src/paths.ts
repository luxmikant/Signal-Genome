import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Locate data/ecosystem.json by walking up from this module. The package may
 * run from packages/ecosystem/src (source) or from a copy/junction under
 * node_modules/@signal/ecosystem/src, so a fixed "../../../data" offset is not
 * reliable. We prefer the nearest ancestor that actually contains the data
 * file; otherwise fall back to <cwd>/data/ecosystem.json.
 */
export function findEcosystemDataPath(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 9; i++) {
    const candidate = join(dir, "data", "ecosystem.json");
    if (existsSync(candidate)) return candidate;
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return join(process.cwd(), "data", "ecosystem.json");
}
