# @subjective-c/runtime

The dependency-free browser renderer for Subjective C.

```js
import { mountSubjective } from "@subjective-c/runtime/browser";

mountSubjective(document.querySelector("#app"), {
  manifest,
  variant,
  data,
  callbacks: {
    onRegenerate() {},
    onContextChange(context) {}
  }
});
```

The runtime emits a bubbling `subjective:action` custom event whenever a generated action is used, so application code can keep domain behavior separate from generated composition.
