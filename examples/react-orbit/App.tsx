import type { ReactNode } from "react";
import { compileSubjective, createDefaultComponentRegistry, createSubjectivePlan, createVariant } from "@subjective-c/core";
import { SubjectiveComposition, SubjectiveProvider, createSubjectiveHost, defineReactComponentPackage, type SubjectiveReactComponentProps } from "@subjective-c/react";
import { defineSubjectiveForm, defineSubjectiveMutation, useSubjectiveMutation } from "@subjective-c/react/forms";
import { SubjectiveRouterOutlet, createSubjectiveRouter } from "@subjective-c/react/router";
import { SubjectiveStatic } from "@subjective-c/react/server";

const manifest = compileSubjective(`# React Orbit

Build a calm project command center.

## Must
- Make creating a project obvious
- Keep search available
`);
const variant = createVariant(manifest, { seed: "react-orbit", context: { experience: "returning" } });
const defaults = createDefaultComponentRegistry(manifest);

function OwnedSlot({ slot, component, invokeAction }: SubjectiveReactComponentProps) {
  const actionId = component.capabilities?.[0];
  return <section data-slot={slot}><strong>{component.id}</strong>{actionId ? <button onClick={() => void invokeAction(actionId)}>Run {actionId}</button> : null}</section>;
}

const reactComponents = defineReactComponentPackage({
  id: "react-orbit-components",
  components: defaults.components.map((component) => ({ ...component, render: OwnedSlot })),
  actions: [...defaults.actions],
  themes: { orbit: { accent: "#4422aa" } }
});
const plan = createSubjectivePlan(manifest, variant, { registry: reactComponents.registry });
const runtimeState = { manifest, variant, plan, data: { items: [] } };

const host = createSubjectiveHost({
  authorizeAction: ({ permission }) => permission === null || permission === "projects:update",
  performAction: ({ id }) => console.info("Subjective action", id)
});

const saveProject = defineSubjectiveMutation({
  id: "save-project",
  label: "Save project",
  permission: "projects:update",
  validate: (input: unknown) => ({ name: String((input as { name?: unknown }).name || "").trim() }),
  mutate: async (input: { name: string }) => ({ ...input, savedAt: new Date().toISOString() })
});

export const projectForm = defineSubjectiveForm({
  id: "project-form",
  mutationId: saveProject.id,
  fields: [{ name: "name", label: "Project name", required: true }]
});

function AppShell({ children }: { children?: ReactNode }) {
  return <div className="react-orbit-shell">{children}</div>;
}

function ProjectRoute({ params, data }: { params: Readonly<Record<string, string>>; data: unknown }) {
  return <p>Project {params.projectId}: {JSON.stringify(data)}</p>;
}

export const router = createSubjectiveRouter({
  routes: [
    { id: "app-shell", path: "/", component: AppShell },
    { id: "project", path: "/projects/:projectId", parentId: "app-shell", component: ProjectRoute, load: async ({ params }) => ({ id: params.projectId }) }
  ]
});

function SaveExample() {
  const mutation = useSubjectiveMutation(saveProject);
  return <button disabled={mutation.status === "pending"} onClick={() => void mutation.run({ name: "Orbit" })}>Save example</button>;
}

export function App() {
  return (
    <SubjectiveProvider initialState={runtimeState} host={host}>
      <SubjectiveComposition registry={reactComponents.registry} />
      <SaveExample />
      <SubjectiveRouterOutlet router={router} fallback={<p>Loading route…</p>} />
    </SubjectiveProvider>
  );
}

export function ServerPreview() {
  return <SubjectiveStatic state={runtimeState} />;
}
