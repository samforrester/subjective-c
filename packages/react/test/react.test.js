import test from "node:test";
import assert from "node:assert/strict";
import { act, createElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { JSDOM } from "jsdom";
import { compileSubjective, createDefaultComponentRegistry, createSubjectivePlan, createVariant } from "@subjective-c/core";
import { SubjectiveComposition, SubjectiveHydratedRoot, SubjectiveProvider, SubjectiveRoot, createSubjectiveHost, defineReactComponentPackage, useSubjective, useSubjectiveAction } from "../src/client.js";
import { SubjectiveStatic } from "../src/server.js";
import { SubjectiveRouterOutlet, createSubjectiveRouter, defineSubjectiveRoute } from "../src/router.js";
import { defineMutationRegistry, defineSubjectiveForm, defineSubjectiveMutation, useSubjectiveMutation } from "../src/forms.js";

const manifest = compileSubjective(`# React Orbit

Build a calm project tracker.

## Must
- Make creating a project obvious
- Keep search available
`);
const variant = createVariant(manifest, { seed: "react-adapter" });
const plan = createSubjectivePlan(manifest, variant);
const state = { manifest, variant, plan, data: { items: [{ name: "Adapter", status: "In progress" }] } };

test("SubjectiveStatic server-renders a complete trusted interpretation", () => {
  const html = renderToStaticMarkup(createElement(SubjectiveStatic, { state }));
  assert.match(html, /data-subjective-react="static"/);
  assert.match(html, /React Orbit/);
  assert.match(html, /Adapter/);
  assert.doesNotMatch(html, /runtime inspector/);
});

test("SubjectiveProvider keeps its initial server tree independent of browser storage", () => {
  const values = new Map([["react-test", JSON.stringify({ density: "compact" })]]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
  function Probe() {
    const subjective = useSubjective();
    return createElement("span", null, `${subjective.state.manifest.name}:${subjective.state.preferences.density || "adaptive"}`);
  }
  const html = renderToStaticMarkup(createElement(SubjectiveProvider, {
    initialState: state,
    preferenceKey: "react-test",
    storage,
    children: createElement(Probe)
  }));
  assert.equal(html, "<span>React Orbit:adaptive</span>");
});

test("React host contracts reject invalid handlers and preserve policy callbacks", async () => {
  assert.throws(() => createSubjectiveHost({ authorizeAction: true }), /must be a function/);
  const events = [];
  const host = createSubjectiveHost({
    authorizeAction: ({ permission }) => permission === "projects:create",
    performAction: ({ id }) => events.push(id)
  });
  assert.equal(await host.authorizeAction({ permission: "projects:create" }), true);
  host.performAction({ id: "create-project" });
  assert.deepEqual(events, ["create-project"]);
});

test("SubjectiveRoot emits a hydration-safe adapter container during SSR", () => {
  const html = renderToStaticMarkup(createElement(SubjectiveRoot, { state, className: "host" }));
  assert.equal(html, '<div class="host" data-subjective-react="root"></div>');
});

test("SubjectiveComposition renders only application-owned components selected by the plan", () => {
  const defaults = createDefaultComponentRegistry(manifest);
  const componentPackage = defineReactComponentPackage({
    id: "react-test-components",
    components: defaults.components.map((component) => ({
      ...component,
      render: ({ slot }) => createElement("section", { "data-slot": slot }, component.id)
    })),
    actions: [...defaults.actions]
  });
  const { registry } = componentPackage;
  const ownedPlan = createSubjectivePlan(manifest, variant, { registry });
  const html = renderToStaticMarkup(createElement(SubjectiveProvider, {
    initialState: { ...state, plan: ownedPlan },
    children: createElement(SubjectiveComposition, { registry })
  }));
  for (const slot of ["navigation", ...ownedPlan.sectionOrder]) {
    if (ownedPlan.slots[slot]) assert.match(html, new RegExp(ownedPlan.slots[slot].componentId));
  }
  assert.match(html, /data-subjective-react="composition"/);
  assert.throws(() => defineReactComponentPackage({ id: "missing-render", components: [{ id: "hero", slot: "hero" }] }), /render function/);
});

test("SubjectiveHydratedRoot preserves server DOM identity while attaching interactions", async () => {
  let performed = 0;
  const host = createSubjectiveHost({ performAction: () => performed++ });
  const app = createElement(SubjectiveProvider, { initialState: state, host }, createElement(SubjectiveHydratedRoot));
  const serverHtml = renderToString(app);
  const dom = new JSDOM(`<!doctype html><div id="root">${serverHtml}</div>`, { url: "https://subjective-c.test" });
  const previous = Object.fromEntries(["window", "document", "Element", "HTMLElement", "CustomEvent", "FormData"].map((key) => [key, globalThis[key]]));
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement,
    CustomEvent: dom.window.CustomEvent,
    FormData: dom.window.FormData,
    IS_REACT_ACT_ENVIRONMENT: true
  });
  const rootElement = document.querySelector("#root");
  const serverShell = rootElement.querySelector(".sc-shell");
  let root;
  try {
    await act(async () => { root = hydrateRoot(rootElement, app); });
    assert.equal(rootElement.querySelector(".sc-shell"), serverShell);
    await act(async () => {
      rootElement.querySelector('[data-sc-action-kind="create"]').click();
      await Promise.resolve();
    });
    assert.equal(performed, 1);
  } finally {
    if (root) await act(async () => root.unmount());
    dom.window.close();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});

test("the React client mounts the runtime, persists preferences, and preserves fail-closed authorization", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "https://subjective-c.test" });
  const previous = Object.fromEntries(["window", "document", "Element", "HTMLElement", "CustomEvent", "FormData"].map((key) => [key, globalThis[key]]));
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement,
    CustomEvent: dom.window.CustomEvent,
    FormData: dom.window.FormData,
    IS_REACT_ACT_ENVIRONMENT: true
  });
  const actionId = manifest.capabilities.find(({ kind }) => kind === "create").id;
  dom.window.localStorage.setItem("subjective-c:react-preferences@1", JSON.stringify({ density: "compact" }));
  const securedState = {
    ...state,
    plan: {
      ...plan,
      actions: plan.actions.map((action) => action.id === actionId ? { ...action, permission: "projects:create" } : action)
    }
  };
  let subjective;
  let mutationState;
  let invokeAction;
  let denied = 0;
  let performed = 0;
  const mutation = defineSubjectiveMutation({
    id: "save-project",
    label: "Save project",
    permission: "projects:update",
    validate: (input) => ({ name: String(input.name).trim() }),
    mutate: async (input) => ({ ...input, saved: true })
  });
  const host = createSubjectiveHost({ authorizeAction: ({ permission }) => permission === "projects:update", actionDenied: () => denied++, performAction: () => performed++ });
  function App() {
    subjective = useSubjective();
    invokeAction = useSubjectiveAction();
    mutationState = useSubjectiveMutation(mutation);
    return createElement(SubjectiveRoot);
  }
  const root = createRoot(document.querySelector("#root"));
  try {
    await act(async () => root.render(createElement(SubjectiveProvider, { initialState: securedState, host, storage: dom.window.localStorage }, createElement(App))));
    assert.ok(document.querySelector(".sc-shell"));
    assert.ok(document.querySelector(".sc-shell").classList.contains("sc-density-compact"));
    await act(async () => subjective.setPreferences({ density: "comfortable" }));
    assert.ok(document.querySelector(".sc-shell").classList.contains("sc-density-comfortable"));
    assert.equal(JSON.parse(dom.window.localStorage.getItem("subjective-c:react-preferences@1")).density, "comfortable");
    await act(async () => {
      document.querySelector(`[data-sc-action="${actionId}"]`).click();
      await Promise.resolve();
    });
    assert.equal(denied, 1);
    assert.equal(performed, 0);
    assert.deepEqual(await invokeAction("not-in-plan"), { ok: false, reason: "untrusted-action" });
    assert.deepEqual(await invokeAction(actionId), { ok: false, reason: "permission-denied" });
    assert.equal(denied, 2);
    let mutationResult;
    await act(async () => { mutationResult = await mutationState.run({ name: "  Orbit  " }); });
    assert.deepEqual(mutationResult, { name: "Orbit", saved: true });
    assert.equal(mutationState.status, "success");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});

test("form and mutation registries reject ambiguous application contracts", () => {
  const mutation = defineSubjectiveMutation({ id: "archive-project", label: "Archive", destructive: true, mutate: () => true });
  const form = defineSubjectiveForm({
    id: "archive-form",
    mutationId: mutation.id,
    fields: [{ name: "reason", label: "Reason", type: "textarea", required: true }]
  });
  const registry = defineMutationRegistry([mutation]);
  assert.equal(registry.get(form.mutationId).id, mutation.id);
  assert.equal(mutation.confirmation.title, "Confirm Archive");
  assert.throws(() => defineSubjectiveForm({ id: "bad-form", mutationId: "archive-project", fields: [
    { name: "reason", label: "Reason" },
    { name: "reason", label: "Again" }
  ] }), /Duplicate field/);
});

test("the router matches nested layouts and starts independent loaders in parallel", async () => {
  const started = [];
  const releases = {};
  const waitForRelease = (id) => new Promise((resolve) => { releases[id] = resolve; });
  const router = createSubjectiveRouter({
    initialPath: "/",
    routes: [
      defineSubjectiveRoute({ id: "app-shell", path: "/", component: ({ children }) => createElement("main", null, children), load: async () => { started.push("shell"); await waitForRelease("shell"); return "Shell data"; } }),
      defineSubjectiveRoute({ id: "project-detail", path: "/projects/:projectId", parentId: "app-shell", component: ({ params, data }) => createElement("h1", null, `${params.projectId}:${data}`), load: async ({ params }) => { started.push("project"); await waitForRelease("project"); return `Project ${params.projectId}`; } })
    ]
  });
  const navigation = router.navigate("/projects/42");
  await Promise.resolve();
  assert.deepEqual(started, ["shell", "project"]);
  assert.equal(router.getSnapshot().status, "loading");
  releases.shell();
  releases.project();
  await navigation;
  assert.equal(router.getSnapshot().status, "ready");
  assert.deepEqual(router.getSnapshot().matches.map(({ route }) => route.id), ["app-shell", "project-detail"]);
  assert.equal(renderToStaticMarkup(createElement(SubjectiveRouterOutlet, { router })), "<main><h1>42:Project 42</h1></main>");
});

test("a superseded navigation cannot overwrite newer router state", async () => {
  let releaseSlow;
  const router = createSubjectiveRouter({
    routes: [
      { id: "home", path: "/" },
      { id: "slow", path: "/slow", load: ({ signal }) => new Promise((resolve) => { releaseSlow = () => resolve(signal.aborted ? "aborted" : "stale"); }) }
    ]
  });
  const slowNavigation = router.navigate("/slow");
  await Promise.resolve();
  await router.navigate("/");
  releaseSlow();
  await slowNavigation;
  assert.equal(router.getSnapshot().path, "/");
  assert.equal(router.getSnapshot().status, "ready");
});
