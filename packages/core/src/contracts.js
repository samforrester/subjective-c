import { CAPABILITY_KINDS, REGISTRY_SCHEMA } from "./constants.js";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function invariant(condition, message) {
  if (!condition) throw new TypeError(message);
}

function assertId(value, label) {
  invariant(typeof value === "string" && ID_PATTERN.test(value), `${label} must be a kebab-case identifier.`);
}

export function defineAction(contract) {
  invariant(contract && typeof contract === "object", "defineAction requires a contract object.");
  assertId(contract.id, "Action id");
  invariant(typeof contract.label === "string" && contract.label.trim(), `Action ${contract.id} requires a label.`);
  invariant(!contract.kind || CAPABILITY_KINDS.includes(contract.kind), `Action ${contract.id} has an unsupported kind.`);
  invariant(contract.permission == null || typeof contract.permission === "string", `Action ${contract.id} permission must be a string or null.`);
  invariant(contract.execute == null || typeof contract.execute === "function", `Action ${contract.id} execute must be a function.`);
  return Object.freeze({
    id: contract.id,
    label: contract.label.trim(),
    kind: contract.kind || "custom",
    permission: contract.permission ?? null,
    destructive: contract.destructive === true,
    execute: contract.execute
  });
}

export function defineComponent(component) {
  invariant(component && typeof component === "object", "defineComponent requires a component contract.");
  assertId(component.id, "Component id");
  invariant(typeof component.slot === "string" && component.slot.trim(), `Component ${component.id} requires a slot.`);
  const capabilities = [...new Set(component.capabilities || [])];
  capabilities.forEach((id) => assertId(id, `Component ${component.id} capability`));
  invariant(component.render == null || typeof component.render === "function", `Component ${component.id} render must be a function.`);
  return Object.freeze({
    id: component.id,
    slot: component.slot,
    variant: component.variant || "default",
    capabilities: Object.freeze(capabilities),
    render: component.render
  });
}

export function defineComponentRegistry(input = {}) {
  const components = (input.components || []).map(defineComponent);
  const actions = (input.actions || []).map(defineAction);
  const componentIds = new Set();
  const actionIds = new Set();
  for (const component of components) {
    invariant(!componentIds.has(component.id), `Duplicate component id: ${component.id}.`);
    componentIds.add(component.id);
  }
  for (const action of actions) {
    invariant(!actionIds.has(action.id), `Duplicate action id: ${action.id}.`);
    actionIds.add(action.id);
  }
  return Object.freeze({
    schema: REGISTRY_SCHEMA,
    components: Object.freeze(components),
    actions: Object.freeze(actions)
  });
}

