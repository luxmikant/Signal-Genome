import { cpSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url).replace(/\\/g, "/"));
const spaceRoot = join(root, "..");
const packagesDir = join(spaceRoot, "packages");
const targetRoot = join(spaceRoot, "node_modules", "@signal");

mkdirSync(targetRoot, { recursive: true });

for (const name of readdirSync(packagesDir)) {
  const pkgDir = join(packagesDir, name);
  const target = join(targetRoot, name);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(join(pkgDir, "package.json"), join(target, "package.json"));
  cpSync(join(pkgDir, "src"), join(target, "src"), { recursive: true });
  console.log(`synced @signal/${name}`);
}
