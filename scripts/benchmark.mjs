import { performance } from "node:perf_hooks";
import { readFile } from "node:fs/promises";
import { compileSubjective, createSubjectivePlan, createVariant } from "@subjective-c/core";

const source = await readFile(new URL("../examples/orbit/app.subjective", import.meta.url), "utf8");
const compileStart = performance.now();
let manifest;
for (let index = 0; index < 1_000; index += 1) manifest = compileSubjective(source);
const compileMs = performance.now() - compileStart;

const planStart = performance.now();
for (let index = 0; index < 5_000; index += 1) {
  const variant = createVariant(manifest, { seed: `benchmark-${index}` });
  createSubjectivePlan(manifest, variant);
}
const planMs = performance.now() - planStart;

if (compileMs > 5_000) throw new Error(`Compiler benchmark exceeded 5s: ${compileMs.toFixed(1)}ms.`);
if (planMs > 10_000) throw new Error(`Planner benchmark exceeded 10s: ${planMs.toFixed(1)}ms.`);
console.log(`✓ compiler ${compileMs.toFixed(1)}ms / 1,000 · planner ${planMs.toFixed(1)}ms / 5,000`);

