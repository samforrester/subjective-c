import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { MANIFEST_SCHEMA, PLAN_SCHEMA, REGISTRY_SCHEMA, VARIANT_SCHEMA } from "@subjective-c/core";

const contracts = [
  ["manifest", MANIFEST_SCHEMA],
  ["variant", VARIANT_SCHEMA],
  ["plan", PLAN_SCHEMA],
  ["registry", REGISTRY_SCHEMA]
];
const declarations = await readFile(new URL("../packages/core/src/index.d.ts", import.meta.url), "utf8");

for (const [name, expected] of contracts) {
  const schema = JSON.parse(await readFile(new URL(`../schemas/${name}.schema.json`, import.meta.url), "utf8"));
  assert.equal(schema.properties.schema.const, expected, `${name} JSON schema drifted from the runtime constant.`);
  assert.ok(declarations.includes(`schema: "${expected}"`), `${name} TypeScript declaration drifted from the runtime constant.`);
}

console.log("✓ runtime constants, JSON schemas, and TypeScript contract versions agree");

