# Component and action contracts

Subjective C adapts presentation only inside an application-owned allowlist. It does not generate arbitrary business behavior.

```js
import { defineAction, defineComponentRegistry } from "@subjective-c/core";

const registry = defineComponentRegistry({
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
      destructive: false,
      execute: createProject
    })
  ]
});
```

`createSubjectivePlan(manifest, variant, { registry })` selects registered components and proves every required capability is reachable. The serializable plan omits `execute`; function references stay inside the host application.

The runtime may change where or how an action appears. It may not invent an action ID, change its label contract, bypass its permission, or execute it. Hosts must enforce permission and destructive-action policy again at the domain boundary.

