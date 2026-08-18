import {
  compileSubjective,
  createDefaultComponentRegistry,
  createSubjectivePlan,
  createVariant,
  defineAction,
  defineComponentRegistry,
  type SubjectivePlan
} from "@subjective-c/core";
import { renderSubjectiveMarkup, type RuntimeState } from "@subjective-c/runtime/browser";
import { defineConfig } from "subjective-c";

const manifest = compileSubjective("# Typed app\n\nBuild a project tracker.");
const variant = createVariant(manifest, { context: { experience: "expert" } });
const action = defineAction({ id: "project-create", label: "New project", permission: "projects:create" });
const defaults = createDefaultComponentRegistry(manifest);
const registry = defineComponentRegistry({ components: [...defaults.components], actions: [action] });
const plan: SubjectivePlan = createSubjectivePlan(manifest, variant, { registry });
const state: RuntimeState = { manifest, variant, plan };

renderSubjectiveMarkup(state);
defineConfig({ novelty: 0.5, allowExternalOutDir: false });

