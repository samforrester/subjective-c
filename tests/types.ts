import {
  compileSubjective,
  createDefaultComponentRegistry,
  createSubjectivePlan,
  createVariant,
  defineAction,
  defineComponentPackage,
  defineComponentRegistry,
  diagnoseSubjective,
  type SubjectivePlan
} from "@subjective-c/core";
import { createPreferenceStore, renderSubjectiveMarkup, type RuntimeState } from "@subjective-c/runtime/browser";
import { defineConfig } from "subjective-c";

const manifest = compileSubjective("# Typed app\n\nBuild a project tracker.");
const variant = createVariant(manifest, { context: { experience: "expert" } });
const action = defineAction({ id: "project-create", label: "New project", permission: "projects:create" });
const defaults = createDefaultComponentRegistry(manifest);
const registry = defineComponentRegistry({ components: [...defaults.components], actions: [...defaults.actions, action] });
const plan: SubjectivePlan = createSubjectivePlan(manifest, variant, { registry });
const state: RuntimeState = { manifest, variant, plan, preferences: { density: "compact" }, themeTokens: { accent: "#4422aa" } };

renderSubjectiveMarkup(state);
diagnoseSubjective({ manifest, registry, plan, authorizeAction: () => true });
defineComponentPackage({ id: "typed-components", components: [...defaults.components], actions: [...defaults.actions], themes: { typed: { accent: "#4422aa" } } });
createPreferenceStore({ storage: localStorage }).save({ contrast: "high" });
defineConfig({ novelty: 0.5, allowExternalOutDir: false });
