# Component and action contracts

Subjective C adapts presentation only inside an application-owned allowlist. It does not generate arbitrary business behavior.

```js
import { defineAction, defineComponentPackage } from "@subjective-c/core";

const orbitComponents = defineComponentPackage({
  id: "orbit-components",
  components: [
    { id: "collection-grid", slot: "collection", variant: "grid", capabilities: ["search"] },
    { id: "collection-table", slot: "collection", variant: "table", capabilities: ["search"] }
  ],
  actions: [
    defineAction({
      id: "project-create",
      label: "New project",
      kind: "create",
      permission: "projects:create",
      execute: createProject
    })
  ],
  themes: {
    orbit: { accent: "#4422aa", "header-height": "72px" }
  }
});

const { registry } = orbitComponents;
```

`createSubjectivePlan(manifest, variant, { registry })` selects registered components and proves every required capability is reachable. The serializable plan omits `execute`; function references stay inside the host application.

Component packages group an application-owned registry with named, validated theme-token sets. Token IDs are converted to `--sc-*` custom properties by the browser runtime; unsafe values containing CSS rule delimiters are rejected.

The runtime may change where or how an action appears. It may not invent an action ID, change its label contract, bypass its permission, or execute it. A permissioned action is denied unless `authorizeAction` returns exactly `true`. A destructive action also requires confirmation copy and a successful host or built-in confirmation step. Hosts must enforce authorization again at the domain boundary because client-side checks are defense in depth, not the final authority.

Run `diagnoseSubjective({ manifest, registry, plan })` before mounting to receive stable diagnostic codes for invalid manifests, unregistered or unreachable capabilities, missing permission hosts, confirmation gaps, and invalid plans.

In React, `SubjectiveComposition` is the application-owned rendering path. It resolves component IDs exclusively from the verified plan and registry, calls registered React render functions, and exposes `invokeAction` for the plan's trusted actions. The reference `SubjectiveRoot` remains available when an application wants the bundled Orbit-style runtime vocabulary.
