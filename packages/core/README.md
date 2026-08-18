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
