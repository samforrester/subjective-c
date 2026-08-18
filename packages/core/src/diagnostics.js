import { validateManifest } from "./compiler.js";
import { createDefaultComponentRegistry, validatePlan } from "./planner.js";

function diagnostic(severity, code, message, path = null) {
  return Object.freeze({ severity, code, message, path });
}

export function diagnoseSubjective(input = {}) {
  const { manifest, plan } = input;
  const diagnostics = [];
  const validation = validateManifest(manifest);
  for (const message of validation.errors) {
    diagnostics.push(diagnostic("error", "manifest.invalid", message, "manifest"));
  }
  if (!validation.valid) return Object.freeze(diagnostics);

  const registry = input.registry || createDefaultComponentRegistry(manifest);
  const actions = new Map(registry.actions.map((action) => [action.id, action]));
  const exposed = new Set(registry.components.flatMap((component) => component.capabilities));

  for (const capability of manifest.capabilities) {
    const action = actions.get(capability.id);
    if (!action) {
      diagnostics.push(diagnostic(capability.required ? "error" : "warning", "capability.unregistered", `Capability ${capability.id} has no action contract.`, `capabilities.${capability.id}`));
    } else if (capability.required && !exposed.has(capability.id)) {
      diagnostics.push(diagnostic("error", "capability.unreachable", `Required capability ${capability.id} is not exposed by a component.`, `capabilities.${capability.id}`));
    }
  }

  for (const action of registry.actions) {
    if (action.permission && typeof input.authorizeAction !== "function") {
      diagnostics.push(diagnostic("warning", "permission.host-required", `Action ${action.id} requires host authorization for ${action.permission}.`, `actions.${action.id}.permission`));
    }
    if (action.destructive && !action.confirmation) {
      diagnostics.push(diagnostic("error", "confirmation.missing", `Destructive action ${action.id} requires confirmation copy.`, `actions.${action.id}.confirmation`));
    }
  }

  if (plan) {
    for (const message of validatePlan(plan, manifest, registry).errors) {
      diagnostics.push(diagnostic("error", "plan.invalid", message, "plan"));
    }
  }

  return Object.freeze(diagnostics);
}

export function formatDiagnostics(diagnostics = []) {
  return diagnostics.map(({ severity, code, message, path }) => `${severity.toUpperCase()} ${code}${path ? ` (${path})` : ""}: ${message}`).join("\n");
}
