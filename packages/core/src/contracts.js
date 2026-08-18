import { CAPABILITY_KINDS, REGISTRY_SCHEMA } from "./constants.js";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const PERMISSION_PATTERN = /^[a-z][a-z0-9]*(?:[.:-][a-z0-9]+)*$/;
const TOKEN_VALUE_PATTERN = /^[^;{}<>]*$/;

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
  invariant(contract.permission == null || (typeof contract.permission === "string" && PERMISSION_PATTERN.test(contract.permission)), `Action ${contract.id} permission must be a namespaced identifier or null.`);
  invariant(contract.execute == null || typeof contract.execute === "function", `Action ${contract.id} execute must be a function.`);
  invariant(contract.confirmation == null || (contract.confirmation && typeof contract.confirmation === "object"), `Action ${contract.id} confirmation must be an object or null.`);
  const destructive = contract.destructive === true;
  const confirmation = destructive
    ? Object.freeze({
      title: String(contract.confirmation?.title || `Confirm ${contract.label}`).trim(),
      description: String(contract.confirmation?.description || "This action may be difficult to undo.").trim(),
      confirmLabel: String(contract.confirmation?.confirmLabel || contract.label).trim()
    })
    : null;
  if (confirmation) {
    invariant(confirmation.title && confirmation.description && confirmation.confirmLabel, `Action ${contract.id} confirmation fields cannot be empty.`);
  }
  return Object.freeze({
    id: contract.id,
    label: contract.label.trim(),
    kind: contract.kind || "custom",
    permission: contract.permission ?? null,
    destructive,
    confirmation,
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

export function defineThemeTokens(input = {}) {
  invariant(input && typeof input === "object" && !Array.isArray(input), "defineThemeTokens requires a token object.");
  const tokens = {};
  for (const [id, value] of Object.entries(input)) {
    assertId(id, "Theme token id");
    invariant((typeof value === "string" || typeof value === "number") && TOKEN_VALUE_PATTERN.test(String(value)), `Theme token ${id} has an unsafe value.`);
    tokens[id] = value;
  }
  return Object.freeze(tokens);
}

export function defineComponentPackage(input = {}) {
  invariant(input && typeof input === "object", "defineComponentPackage requires a package contract.");
  assertId(input.id, "Component package id");
  const registry = defineComponentRegistry(input);
  const themes = Object.fromEntries(Object.entries(input.themes || {}).map(([id, tokens]) => {
    assertId(id, "Theme id");
    return [id, defineThemeTokens(tokens)];
  }));
  return Object.freeze({
    id: input.id,
    registry,
    themes: Object.freeze(themes)
  });
}
