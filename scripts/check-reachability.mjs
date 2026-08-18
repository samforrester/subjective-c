import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compileSubjective, createSubjectivePlan, createVariant } from "@subjective-c/core";

const source = await readFile(new URL("../examples/orbit/app.subjective", import.meta.url), "utf8");
const manifest = compileSubjective(source);
const contexts = [
  { experience: "novice", device: "mobile" },
  { experience: "returning", device: "desktop" },
  { experience: "expert", device: "desktop", input: "keyboard" }
];
const required = manifest.capabilities.filter(({ required }) => required).map(({ id }) => id);

let checked = 0;
for (const context of contexts) {
  for (let index = 0; index < 40; index += 1) {
    const variant = createVariant(manifest, { seed: `semantic-${index}`, context, novelty: index / 39 });
    const plan = createSubjectivePlan(manifest, variant);
    assert.deepEqual(plan.invariants.requiredCapabilities, required);
    for (const id of required) assert.ok(plan.reachableCapabilities.includes(id), `${id} is unreachable in ${variant.id}`);
    assert.ok(plan.invariants.anchors.includes("primary-action"));
    checked += 1;
  }
}

console.log(`✓ ${checked} semantic plans preserve required capabilities and anchors`);

