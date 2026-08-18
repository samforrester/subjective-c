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
import { createElement } from "react";
import { SubjectiveComposition, SubjectiveHydratedRoot, SubjectiveProvider, SubjectiveRoot, createSubjectiveHost, useSubjective } from "@subjective-c/react";
import { SubjectiveStatic } from "@subjective-c/react/server";
import { SubjectiveRouterOutlet, createSubjectiveRouter } from "@subjective-c/react/router";
import { defineSubjectiveForm, defineSubjectiveMutation, useSubjectiveMutation } from "@subjective-c/react/forms";

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

const host = createSubjectiveHost({ authorizeAction: ({ permission }) => permission === "projects:create" });
createElement(SubjectiveProvider, { initialState: state, host }, createElement(SubjectiveRoot));
createElement(SubjectiveProvider, { initialState: state, host }, createElement(SubjectiveHydratedRoot));
createElement(SubjectiveStatic, { state });
createElement(SubjectiveComposition, { registry, state });
void useSubjective;
const router = createSubjectiveRouter({ routes: [{ id: "home", path: "/", component: () => createElement("main") }] });
createElement(SubjectiveRouterOutlet, { router });
const mutation = defineSubjectiveMutation({ id: "save-project", label: "Save", mutate: async (input: { name: string }) => input.name });
defineSubjectiveForm({ id: "save-form", mutationId: mutation.id, fields: [{ name: "name", label: "Name", required: true }] });
void useSubjectiveMutation;
