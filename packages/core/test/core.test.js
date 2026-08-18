import test from "node:test";
import assert from "node:assert/strict";
import {
  compileSubjective,
  compileWithProvider,
  createSubjectivePlan,
  createVariant,
  createVariants,
  parseSubjectiveSource,
  validateManifest,
  variantDistance
} from "../src/index.js";

const source = `# Orbit

Build a calm project command center for small teams. Every refresh may reinterpret the interface.

## Must
- Make creating a project obvious
- Keep search available

## Avoid
- Modal-heavy workflows

## Adapt
- New users should see more guidance
- Power users should get denser information

## Actions
- Filter projects
- Invite a teammate
`;

test("parses structured subjective source", () => {
  const parsed = parseSubjectiveSource(source);
  assert.equal(parsed.title, "Orbit");
  assert.equal(parsed.sections.must.length, 2);
  assert.equal(parsed.sections.avoid[0], "Modal-heavy workflows");
});

test("compiles a serializable manifest with required capabilities", () => {
  const manifest = compileSubjective(source);
  assert.equal(manifest.domain.singular, "Project");
  assert.ok(manifest.capabilities.some(({ kind, required }) => kind === "create" && required));
  assert.ok(manifest.capabilities.some(({ kind, required }) => kind === "search" && required));
  assert.ok(manifest.capabilities.some(({ kind }) => kind === "filter"));
  assert.equal(validateManifest(manifest).valid, true);
  assert.doesNotThrow(() => JSON.stringify(manifest));
});

test("variants are deterministic for identical inputs", () => {
  const manifest = compileSubjective(source);
  const left = createVariant(manifest, { seed: "same", context: { experience: "expert" } });
  const right = createVariant(manifest, { seed: "same", context: { experience: "expert" } });
  assert.deepEqual(left, right);
});

test("the default assignment is stable for the same user context", () => {
  const manifest = compileSubjective(source);
  assert.deepEqual(createVariant(manifest), createVariant(manifest));
});

test("plans select only registered components and keep required actions reachable", () => {
  const manifest = compileSubjective(source);
  const variant = createVariant(manifest, { seed: "plan" });
  const plan = createSubjectivePlan(manifest, variant);
  assert.equal(plan.manifestHash, manifest.source.hash);
  assert.equal(plan.variantId, variant.id);
  assert.ok(Object.values(plan.slots).every(({ componentId }) => typeof componentId === "string"));
  for (const capability of manifest.capabilities.filter(({ required }) => required)) {
    assert.ok(plan.reachableCapabilities.includes(capability.id));
  }
});

test("manifest validation rejects provider-controlled icon markup", () => {
  const manifest = compileSubjective(source);
  manifest.domain.icon = '<img src=x onerror="alert(1)">';
  const validation = validateManifest(manifest);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /icon/);
});

test("context changes the interpretation policy", () => {
  const manifest = compileSubjective(source);
  const novice = createVariant(manifest, { seed: "context", context: { experience: "novice" } });
  const expert = createVariant(manifest, { seed: "context", context: { experience: "expert" } });
  assert.equal(novice.composition.copyMode, "explanatory");
  assert.equal(expert.composition.copyMode, "terse");
  assert.notEqual(novice.density, expert.density);
});

test("createVariants returns distinct reproducible candidates", () => {
  const manifest = compileSubjective(source);
  const variants = createVariants(manifest, { seed: "set", count: 5 });
  assert.equal(variants.length, 5);
  assert.equal(new Set(variants.map(({ id }) => id)).size, 5);
  assert.ok(variantDistance(variants[0], variants[1]) >= 0);
});


test("invalid provider output falls back to the local compiler", async () => {
  const provider = { name: "broken", async compile() { return { name: "Incomplete" }; } };
  const result = await compileWithProvider(source, { provider, fallback: true });
  assert.equal(result.fallback, true);
  assert.equal(result.provider, "local");
  assert.equal(result.manifest.name, "Orbit");
  assert.match(result.warning, /invalid manifest/i);
});

test("provider failures surface when fallback is disabled", async () => {
  const provider = { name: "broken", async compile() { throw new Error("provider unavailable"); } };
  await assert.rejects(() => compileWithProvider(source, { provider, fallback: false }), /provider unavailable/);
});
