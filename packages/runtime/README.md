# @subjective-c/runtime

The dependency-free browser renderer for Subjective C.

```js
import { createPreferenceStore, hydrateSubjective, mountSubjective } from "@subjective-c/runtime/browser";

const preferences = createPreferenceStore();

mountSubjective(document.querySelector("#app"), {
  manifest,
  variant,
  plan,
  data,
  preferences: preferences.load(),
  themeTokens: { accent: "#4422aa" },
  callbacks: {
    onRegenerate() {},
    onContextChange(context) {},
    onPreferenceChange: (next) => preferences.save(next),
    authorizeAction: ({ permission }) => currentUser.permissions.includes(permission)
  }
});
```

The runtime emits a bubbling `subjective:action` custom event only after trusted-plan, permission, and destructive-confirmation gates pass, so application code can keep domain behavior separate from generated composition. Services must still enforce authorization at the mutation boundary.

When the server has already emitted `renderSubjectiveMarkup(state)`, call `hydrateSubjective(target, state)` to attach the same interaction boundary without replacing matching DOM. Manifest or variant mismatches fall back to a fresh client render by default; pass `{ fallback: false }` for strict rejection.
