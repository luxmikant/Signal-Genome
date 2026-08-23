import { cpSync, lstatSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url).replace(/\\/g, "/"));
const spaceRoot = join(root, "..");
const packagesDir = join(spaceRoot, "packages");
const targetRoot = join(spaceRoot, "node_modules", "@signal");

mkdirSync(targetRoot, { recursive: true });

// This volume is exFAT: no symlinks, no junctions. Workspace packages are
// mirrored into node_modules as real-directory copies; never skip an existing
// target, or consumers would chase stale code.
for (const name of readdirSync(packagesDir)) {
  const target = join(targetRoot, name);
  const src = join(packagesDir, name);
  try {
    rmSync(target, { recursive: true, force: true });
  } catch (err) {
    if (!lstatSync(target, { throwIfNoEntry: false })?.isDirectory()) throw err;
  }
  cpSync(src, target, { recursive: true });
  console.log(`synced @signal/${name}`);
}
