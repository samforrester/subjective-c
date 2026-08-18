# @subjective-c/core

Dependency-free intent compiler and constrained variation engine for Subjective C.

```js
import { compileSubjective, createVariant } from "@subjective-c/core";

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
```
