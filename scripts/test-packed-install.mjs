import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const packages = [
  "@subjective-c/core",
  "@subjective-c/runtime",
  "@subjective-c/react",
  "subjective-c",
  "create-subjective-c"
];
const root = new URL("..", import.meta.url).pathname;
const directory = await mkdtemp(join(tmpdir(), "subjective-c-consumer-"));
const cache = join(directory, "npm-cache");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: cache, ...options.env }
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${command} failed.`);
  return result.stdout.trim();
}

try {
  const tarballs = packages.map((name) => {
    const output = run("npm", ["pack", "--json", `--workspace=${name}`, `--pack-destination=${directory}`]);
    const [metadata] = JSON.parse(output);
    return join(directory, metadata.filename);
  });

  await writeFile(join(directory, "package.json"), JSON.stringify({
    name: "subjective-c-packed-install-smoke",
    private: true,
    type: "module"
  }, null, 2));

  run("npm", [
    "install",
    "--offline",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--legacy-peer-deps",
    ...tarballs
  ], { cwd: directory });

  const rootPackage = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const smoke = `
    import { compileSubjective, SUBJECTIVE_C_VERSION } from "@subjective-c/core";
    import { SUBJECTIVE_RUNTIME_VERSION } from "@subjective-c/runtime";
    const source = "# Packed install\\n\\n## Must\\n- Search places\\n\\n## Data\\n- Places";
    const manifest = compileSubjective(source);
    if (manifest.name !== "Packed install") throw new Error("Packed core did not compile source.");
    if (SUBJECTIVE_C_VERSION !== ${JSON.stringify(rootPackage.version)}) throw new Error("Core version mismatch.");
    if (SUBJECTIVE_RUNTIME_VERSION !== ${JSON.stringify(rootPackage.version)}) throw new Error("Runtime version mismatch.");
  `;
  run(process.execPath, ["--input-type=module", "--eval", smoke], { cwd: directory });
  const cliVersion = run(join(directory, "node_modules", ".bin", "subjective"), ["--version"], { cwd: directory });
  if (cliVersion !== rootPackage.version) throw new Error(`CLI version mismatch: ${cliVersion}.`);

  for (const name of packages) {
    const installed = JSON.parse(await readFile(join(directory, "node_modules", ...name.split("/"), "package.json"), "utf8"));
    if (installed.version !== rootPackage.version) throw new Error(`${name} installed as ${installed.version}.`);
  }
  console.log(`✓ all five ${rootPackage.version} tarballs install and execute in a clean consumer project`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
