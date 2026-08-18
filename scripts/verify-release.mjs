import { mkdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packages = [
  ["@subjective-c/core", 80_000],
  ["@subjective-c/runtime", 180_000],
  ["@subjective-c/react", 80_000],
  ["subjective-c", 140_000],
  ["create-subjective-c", 50_000]
];
const root = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const npmCache = fileURLToPath(new URL("../.cache/npm", import.meta.url));
await mkdir(npmCache, { recursive: true });

for (const [name, budget] of packages) {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json", `--workspace=${name}`], {
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: npmCache }
  });
  if (result.status !== 0) throw new Error(result.stderr || `npm pack failed for ${name}.`);
  const [metadata] = JSON.parse(result.stdout);
  if (metadata.size > budget) throw new Error(`${name} tarball is ${metadata.size} bytes; budget is ${budget}.`);
  if (!metadata.files.some(({ path }) => path === "README.md")) throw new Error(`${name} package is missing README.md.`);
  console.log(`✓ ${name} ${metadata.size} bytes (budget ${budget})`);
}

if (!root.private) throw new Error("The monorepo root must remain private.");
if (root.version !== "0.3.0-alpha.3") throw new Error("Unexpected release version.");
console.log("✓ release metadata and package contents verified");
