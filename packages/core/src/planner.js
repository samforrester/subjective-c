import { PLAN_SCHEMA } from "./constants.js";
import { defineComponentRegistry } from "./contracts.js";

const SLOT_SELECTIONS = Object.freeze({
  navigation: (variant) => variant.navigation,
  hero: (variant) => variant.composition.hero,
  collection: (variant) => variant.composition.collection,
  metrics: (variant) => variant.composition.metrics,
  activity: (variant) => variant.composition.activity
});

function componentId(slot, variant) {
  return `${slot}-${String(variant).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

export function createDefaultComponentRegistry(manifest) {
  const variants = {
    navigation: ["side", "top"],
    hero: ["welcome", "compact", "statement"],
    collection: ["grid", "rows", "table", "board"],
    metrics: ["cards", "strip", "sentence", "rail"],
    activity: ["feed", "ticker", "timeline", "compact"]
  };
  const slotKinds = {
    navigation: ["browse", "navigate"],
    hero: ["create"],
    collection: ["browse", "search", "filter", "sort"],
    metrics: [],
    activity: []
  };
  const components = Object.entries(variants).flatMap(([slot, names]) => names.map((variant) => ({
    id: componentId(slot, variant),
    slot,
    variant,
    capabilities: manifest.capabilities
      .filter(({ kind }) => slotKinds[slot].includes(kind))
      .map(({ id }) => id)
  })));
  const actions = manifest.capabilities.map((capability) => ({
    id: capability.id,
    label: capability.label,
    kind: capability.kind,
    permission: null,
    destructive: false
  }));
  return defineComponentRegistry({ components, actions });
}

export function validatePlan(plan, manifest, registry) {
  const errors = [];
  if (!plan || typeof plan !== "object") return { valid: false, errors: ["Plan must be an object."] };
  if (plan.schema !== PLAN_SCHEMA) errors.push(`Plan schema must be ${PLAN_SCHEMA}.`);
  if (plan.manifestHash !== manifest?.source?.hash) errors.push("Plan manifestHash does not match the manifest.");
  const knownComponents = new Map(registry.components.map((component) => [component.id, component]));
  for (const [slot, selection] of Object.entries(plan.slots || {})) {
    const component = knownComponents.get(selection?.componentId);
    if (!component) {
      errors.push(`Plan slot ${slot} does not reference a trusted component.`);
    } else if (component.slot !== slot || component.variant !== selection.variant) {
      errors.push(`Plan slot ${slot} does not match trusted component ${component.id}.`);
    }
  }
  const knownActions = new Set(registry.actions.map(({ id }) => id));
  for (const action of plan.actions || []) {
    if (!knownActions.has(action.id)) errors.push(`Plan action ${action.id} is not registered.`);
  }
  const reachable = new Set(plan.reachableCapabilities || []);
  for (const id of reachable) {
    if (!knownActions.has(id)) errors.push(`Reachable capability ${id} is not a registered action.`);
  }
  for (const capability of manifest?.capabilities || []) {
    if (capability.required && !reachable.has(capability.id)) {
      errors.push(`Required capability ${capability.id} is not reachable.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function createSubjectivePlan(manifest, variant, options = {}) {
  const registry = options.registry || createDefaultComponentRegistry(manifest);
  const slots = {};
  const reachable = new Set();
  for (const [slot, select] of Object.entries(SLOT_SELECTIONS)) {
    const selectedVariant = select(variant);
    const component = registry.components.find((candidate) => candidate.slot === slot && candidate.variant === selectedVariant);
    if (!component) throw new Error(`No trusted ${slot} component is registered for variant ${selectedVariant}.`);
    slots[slot] = { componentId: component.id, variant: selectedVariant };
    component.capabilities.forEach((id) => reachable.add(id));
  }
  const plan = {
    schema: PLAN_SCHEMA,
    manifestHash: manifest.source.hash,
    variantId: variant.id,
    slots,
    sectionOrder: [...variant.composition.sections],
    actions: registry.actions.map(({ execute, ...contract }) => contract),
    reachableCapabilities: [...reachable].sort(),
    invariants: {
      anchors: [...manifest.policies.anchors],
      requiredCapabilities: manifest.capabilities.filter(({ required }) => required).map(({ id }) => id),
      accessibility: { ...manifest.policies.accessibility }
    }
  };
  const validation = validatePlan(plan, manifest, registry);
  if (!validation.valid) throw new Error(`Invalid Subjective C plan: ${validation.errors.join(" ")}`);
  return plan;
}
