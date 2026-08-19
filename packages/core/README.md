# @subjective-c/core

Dependency-free intent compiler and constrained variation engine for Subjective C.

```js
import { compileSubjective, createSubjectivePlan, createVariant, defineComponentPackage, diagnoseSubjective } from "@subjective-c/core";

const manifest = compileSubjective(`
# Orbit
Build a calm project command center.

## Must
- Make creating a project obvious
- Keep search available
`);

const variant = createVariant(manifest, {
  seed: "demo-1",
  context: { experience: "expert" }
});

const componentPackage = defineComponentPackage({
  id: "orbit-components",
  components,
  actions,
  themes: { orbit: { accent: "#4422aa" } }
});
const plan = createSubjectivePlan(manifest, variant, { registry: componentPackage.registry });
const diagnostics = diagnoseSubjective({ manifest, registry: componentPackage.registry, plan });
```

Intent adaptation is an explicit, dependency-free layer:

```js
import { createVisitorModel, observeVisitorSignal, resolveAdaptiveData } from "@subjective-c/core";

const adaptation = {
  defaultIntent: "discover",
  intents: [
    { id: "discover", label: "Discover", keywords: ["surprise"] },
    { id: "outdoors", label: "Outside", keywords: ["hike", "trail"], interpretation: "golden-gate" }
  ]
};

let visitor = createVisitorModel(adaptation);
visitor = observeVisitorSignal(visitor, { kind: "search", text: "a sunset hike" }, adaptation);
const data = resolveAdaptiveData(canonicalData, visitor, adaptation);
```

The visitor model stores bounded intent scores and human-readable evidence—not raw profiles or inferred demographics. Applications decide whether it lives in memory, session storage, or local storage.
