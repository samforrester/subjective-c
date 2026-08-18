# Changelog

## 0.3.0-alpha.2 — 2026-08-17

- Added `hydrateSubjective` to attach trusted runtime behavior to matching server-rendered markup without replacing its DOM.
- Added `SubjectiveHydratedRoot` for an identical React server/client tree with interaction binding after hydration.
- Added manifest and variant identity markers plus strict mismatch rejection and safe client-render fallback.
- Deferred browser-only preference restoration until client binding so the initial server and hydration trees remain deterministic.
- Separated runtime event binding from markup generation while preserving focus, actions, preferences, forms, and cleanup behavior.
- Added runtime and React hydration tests that assert server DOM node identity survives hydration.

## 0.3.0-alpha.1 — 2026-08-17

- Added `@subjective-c/react` with a managed provider, client runtime root, Suspense data boundary, and static server renderer.
- Added application-owned host contracts that preserve authorization, confirmation, action, error, and preference boundaries in React.
- Added nested route contracts, abortable parallel route loaders, external-store subscriptions, and a React outlet.
- Added typed form and mutation contracts with validation, cancellation, authorization, confirmation, and result state.
- Added a strict-typed React Orbit integration example plus server, client, routing, mutation, and policy tests.
- Versioned and hardened preference storage against unavailable or quota-limited browser storage.
- Updated GitHub Actions to the current Node 24-based checkout and setup actions.

## 0.2.0-alpha.2 — 2026-08-17

- Added application-owned component packages and validated theme-token contracts.
- Added fail-closed host authorization and destructive-action confirmation before semantic action dispatch.
- Added persisted density, motion, contrast, and palette preference APIs and inspector controls.
- Added structured manifest, registry, permission, capability, and plan diagnostics.
- Corrected reachability so capabilities must be exposed by selected components rather than merely registered.
- Expanded unit, type, browser, security, semantic, and schema coverage for the new boundaries.

## 0.2.0-alpha.1 — 2026-08-17

- Added policy-constrained component and action registries plus deterministic plans.
- Made stable context assignments the default while retaining explicit reinterpretation.
- Added safe atomic output builds with external-path and project-root guards.
- Hardened provider validation and HTML escaping at the runtime boundary.
- Added semantic reachability, browser, accessibility, benchmark, doctor, and release gates.

## 0.1.0 — 2026-08-17

- Added the local intent compiler and manifest validator.
- Added deterministic contextual variants and stable anchors.
- Added the dependency-free browser runtime and inspector.
- Added the `subjective` CLI with init, dev, build, inspect, and doctor commands.
- Added provider fallback, static build output, schemas, tests, documentation, and the Orbit example.
