# Architecture

## Overview

Subjective C has five deliberately separate layers.

### 1. Source

`app.subjective` is an English product brief with optional Markdown headings. The headings are not a new programming language; they make intent classification explicit and reproducible.

Recognized concepts include purpose, must, prefer, avoid, adapt, audience, tone, actions, data, and navigation.

### 2. Compiler or provider

The compiler converts source into `subjective-c/manifest@0.2`.

The bundled local compiler:

- Parses structured sections and freeform sentences
- Infers the product domain
- Extracts capabilities from action language
- Classifies hard and soft constraints
- Infers audience, tone, novelty, stability, and refresh policy
- Emits an inspectable source hash

A provider may replace this process. Provider output passes through manifest validation before the build continues.

### 3. Variant engine

The variant engine is deterministic for a given manifest, context, novelty, and seed.

Inputs:

```js
createVariant(manifest, {
  seed: "shareable-seed",
  novelty: 0.72,
  context: {
    experience: "expert",
    device: "desktop",
    motion: "reduced",
    contrast: "high"
  }
});
```

Outputs include layout, density, navigation orientation, collection representation, metric representation, activity representation, section order, copy mode, palette, radius, motion, stable anchors, and an explanation.

The engine is policy-driven rather than component-generating. This keeps its output testable and makes the runtime responsible for rendering known components.

### 4. Registry and planner

Applications define the components and actions the runtime is allowed to use. The planner maps a variant onto that allowlist and emits `subjective-c/plan@0.1`. Planning fails if a selected component is unregistered or a required capability becomes unreachable.

The plan is serializable and records selected component IDs, action contracts, stable anchors, accessibility policy, required capabilities, and section order. Rendering never grants new behavior.

### 5. Runtime

The browser runtime receives a manifest, variant, and application data. It renders semantic HTML and emits `subjective:action` events.

The current runtime contains a reference component vocabulary:

- Brand and navigation
- Primary and secondary actions
- Hero and guidance
- Metrics
- Grid, row, table, and board collections
- Activity and insight sections
- Search and filtering hooks
- Create and detail dialogs
- Inspector and variant explanation

Production applications can define a component registry; the alpha browser runtime ships a reference registry for the Orbit example.

## Build output

`subjective build` emits a static application:

```text
dist/
├── index.html
├── app.js
├── manifest.json
├── plan.json
├── app.subjective
├── .subjective-build.json
└── _subjective/
    ├── core/
    └── runtime/
```

There is no server requirement. The generated browser entry recompiles edited intent locally in the inspector and creates new variants from browser-generated seeds.

## Determinism

A variant seed is part of the public debugging model. A bug report should be reproducible with:

- Source hash
- Manifest version
- Runtime version
- Context
- Novelty
- Seed

The same inputs must produce the same variant plan.

## Safety boundary

The current alpha protects semantics through validated manifests, trusted registries, verified plans, escaped provider values, guarded output paths, atomic builds, and stable action identifiers. A production architecture should still add:

- Host-enforced permission checks and destructive-action confirmation UI
- Manifest signatures and content-security policy
- Independent security and accessibility review
- Server-side seed assignment for experiments
- Telemetry privacy controls
