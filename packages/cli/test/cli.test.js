import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { buildProject } from "../src/build.js";

let temporary;

test.beforeEach(async () => {
  temporary = await mkdtemp(join(tmpdir(), "subjective-c-"));
  await writeFile(join(temporary, "app.subjective"), `# Test App\n\nBuild a calm project tracker.\n\n## Must\n- Make creating a project obvious\n- Keep search available\n`, "utf8");
  await writeFile(join(temporary, "subjective.config.js"), "export default { novelty: 0.5, devtools: true };\n", "utf8");
});

test.afterEach(async () => {
  await rm(temporary, { recursive: true, force: true });
});

test("buildProject emits a self-contained static application", async () => {
  const result = await buildProject(temporary, { quiet: true });
  const html = await readFile(join(result.outDirectory, "index.html"), "utf8");
  const app = await readFile(join(result.outDirectory, "app.js"), "utf8");
  const manifest = JSON.parse(await readFile(join(result.outDirectory, "manifest.json"), "utf8"));
  const plan = JSON.parse(await readFile(join(result.outDirectory, "plan.json"), "utf8"));
  assert.match(html, /Subjective C/);
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /id="app" aria-live/);
  assert.match(app, /mountSubjective/);
  assert.equal(manifest.name, "Test App");
  assert.equal(plan.manifestHash, manifest.source.hash);
});

test("buildProject refuses to delete an output directory outside the project", async () => {
  const outside = join(dirname(temporary), `${basename(temporary)}-important`);
  await mkdir(outside);
  await writeFile(join(outside, "sentinel.txt"), "keep me", "utf8");
  await assert.rejects(() => buildProject(temporary, { quiet: true, outDir: outside }), /must stay inside the project/);
  assert.equal(await readFile(join(outside, "sentinel.txt"), "utf8"), "keep me");
  await rm(outside, { recursive: true, force: true });
});

test("buildProject refuses the project root as output", async () => {
  await assert.rejects(() => buildProject(temporary, { quiet: true, outDir: "." }), /project root/);
  await access(join(temporary, "app.subjective"));
});

test("a failed rebuild preserves the last successful output", async () => {
  const first = await buildProject(temporary, { quiet: true });
  const original = await readFile(join(first.outDirectory, "index.html"), "utf8");
  await writeFile(join(temporary, "subjective.config.js"), "throw new Error('broken config');\n", "utf8");
  await assert.rejects(() => buildProject(temporary, { quiet: true }), /broken config/);
  assert.equal(await readFile(join(first.outDirectory, "index.html"), "utf8"), original);
});


test("buildProject escapes the application name in HTML", async () => {
  await writeFile(join(temporary, "app.subjective"), `# <img src=x onerror=alert(1)>

Build a project tracker.
`, "utf8");
  const result = await buildProject(temporary, { quiet: true });
  const html = await readFile(join(result.outDirectory, "index.html"), "utf8");
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});
