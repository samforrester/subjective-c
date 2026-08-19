import test from "node:test";
import assert from "node:assert/strict";
import {
  compileSubjective,
  compileWithProvider,
  defineAction,
  defineComponentPackage,
  defineComponentRegistry,
  diagnoseSubjective,
  createVisitorModel,
  observeVisitorSignal,
  resolveAdaptiveData,
  SUBJECTIVE_INTERPRETATIONS,
  createSubjectivePlan,
  createVariant,
  createVariants,
  parseSubjectiveSource,
  validateManifest,
  variantDistance
} from "../src/index.js";

const adaptation = {
  defaultIntent: "discover",
  intents: [
    { id: "discover", label: "Discover", keywords: ["surprise", "anything"], interpretation: "dream-fold" },
    { id: "outdoors", label: "Get outside", keywords: ["hike", "trail", "outside"], interpretation: "golden-gate" },
    { id: "nightlife", label: "Go out", keywords: ["dance", "club", "dj"], interpretation: "mission-neon" }
  ]
};

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

test("visitor evidence resolves intent without changing the canonical data contract", () => {
  const initial = createVisitorModel(adaptation);
  const searched = observeVisitorSignal(initial, { kind: "search", text: "a sunset hike and trail" }, adaptation);
  assert.equal(searched.intent, "outdoors");
  assert.ok(searched.confidence > 0.5);
  assert.match(searched.reasons[0], /search/i);
  const resolved = resolveAdaptiveData({ stable: "same", experiences: { outdoors: { hero: { title: "Find the edge" } } } }, searched, adaptation);
  assert.equal(resolved.stable, "same");
  assert.equal(resolved.hero.title, "Find the edge");
  assert.equal(resolved.adaptation.intent, "outdoors");
});

test("explicit visitor choices outweigh earlier behavioral evidence and remain bounded", () => {
  let model = createVisitorModel(adaptation);
  model = observeVisitorSignal(model, { kind: "search", text: "hike trail outside" }, adaptation);
  model = observeVisitorSignal(model, { kind: "select", intent: "nightlife" }, adaptation);
  assert.equal(model.intent, "nightlife");
  assert.equal(model.revision, 2);
  assert.ok(model.evidence.length <= 16);
});

test("common search words do not create false intent ties", () => {
  const model = observeVisitorSignal(createVisitorModel(adaptation), { kind: "search", text: "I want to dance" }, adaptation);
  assert.equal(model.intent, "nightlife");
  assert.equal(model.scores.discover, 0);
});

test("createVariants returns distinct reproducible candidates", () => {
  const manifest = compileSubjective(source);
  const variants = createVariants(manifest, { seed: "set", count: 5 });
  assert.equal(variants.length, 5);
  assert.equal(new Set(variants.map(({ id }) => id)).size, 5);
  assert.ok(variantDistance(variants[0], variants[1]) >= 0);
});

test("SF interpretations can be pinned and preserve their operational identity", () => {
  const manifest = compileSubjective(source);
  assert.equal(SUBJECTIVE_INTERPRETATIONS.length, 11);
  for (const interpretation of SUBJECTIVE_INTERPRETATIONS) {
    const variant = createVariant(manifest, {
      seed: `pinned:${interpretation.id}`,
      novelty: 0.9,
      interpretation: interpretation.id
    });
    assert.equal(variant.theme.interpretation, interpretation.id);
    assert.equal(variant.theme.label, interpretation.label);
    assert.equal(variant.theme.location, interpretation.location);
    assert.ok(interpretation.layouts.includes(variant.layout));
    assert.match(variant.explanation.join(" "), /San Francisco/);
  }
  assert.throws(() => createVariant(manifest, { interpretation: "not-a-place" }), /Unknown Subjective C interpretation/);
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

test("action contracts normalize destructive confirmation and validate permission identifiers", () => {
  const action = defineAction({ id: "delete-project", label: "Delete project", permission: "projects:delete", destructive: true });
  assert.equal(action.confirmation.confirmLabel, "Delete project");
  assert.equal(action.confirmation.description, "This action may be difficult to undo.");
  assert.throws(() => defineAction({ id: "bad-action", label: "Bad", permission: "projects delete" }), /namespaced identifier/);
});

test("component packages own frozen registries and safe theme tokens", () => {
  const componentPackage = defineComponentPackage({
    id: "orbit-components",
    components: [{ id: "hero-welcome", slot: "hero", variant: "welcome", capabilities: ["create-project"] }],
    actions: [{ id: "create-project", label: "Create project", kind: "create" }],
    themes: { orbit: { accent: "#4422aa", "header-height": "72px" } }
  });
  assert.equal(componentPackage.registry.actions[0].id, "create-project");
  assert.equal(componentPackage.themes.orbit.accent, "#4422aa");
  assert.ok(Object.isFrozen(componentPackage.themes.orbit));
  assert.throws(() => defineComponentPackage({ id: "unsafe", themes: { bad: { accent: "red;display:none" } } }), /unsafe value/);
});

test("diagnostics expose unreachable required capabilities before rendering", () => {
  const manifest = compileSubjective(source);
  const registry = defineComponentRegistry({
    components: [{ id: "hero-welcome", slot: "hero", variant: "welcome", capabilities: [] }],
    actions: manifest.capabilities.map((capability) => ({ ...capability }))
  });
  const diagnostics = diagnoseSubjective({ manifest, registry });
  assert.ok(diagnostics.some(({ code, severity }) => code === "capability.unreachable" && severity === "error"));
});
