# @subjective-c/react

React 19 bindings for Subjective C. The client adapter preserves the existing trusted runtime boundary instead of reimplementing plan enforcement inside React.

```jsx
import { SubjectiveProvider, SubjectiveRoot, createSubjectiveHost } from "@subjective-c/react";
import "@subjective-c/runtime/styles.css";

const host = createSubjectiveHost({
  authorizeAction: ({ permission }) => session.permissions.includes(permission),
  performAction: ({ id }) => actions[id]?.()
});

export function App() {
  return (
    <SubjectiveProvider initialState={{ manifest, variant, plan, data }} host={host}>
      <SubjectiveRoot />
    </SubjectiveProvider>
  );
}
```

`SubjectiveDataBoundary` accepts an already-started data promise and unwraps it with React Suspense without creating a fetch waterfall. `@subjective-c/react/server` exports `SubjectiveStatic` for non-interactive server-rendered output. Only serializable, UI-required state should cross a React Server Component boundary.

Use `SubjectiveHydratedRoot` when the same React tree renders on the server and hydrates in the browser. It emits the complete interpretation during SSR and binds runtime interactions after hydration without replacing matching server DOM.

`SubjectiveProvider` keeps its initial server and client trees deterministic, then restores browser-only preferences during client binding. If the server can read preferences from a cookie or request profile, include them in `initialState.preferences` so the preferred presentation is present in the HTML itself.

`@subjective-c/react/router` provides nested layouts, abortable parallel loaders, and `SubjectiveRouterOutlet`. `@subjective-c/react/forms` provides typed form and mutation contracts plus a policy-constrained mutation hook. Mutation functions that call a server remain public mutation boundaries: authenticate, authorize, and validate again inside the server handler.

For application-owned React component packages, use `SubjectiveComposition`. It resolves only component IDs selected by the verified plan and passes each registered render function the manifest, variant, data, and a policy-constrained `invokeAction` function. Unregistered actions fail closed.
