# Same SF reference application

Same SF is the first intent-adaptive marketing application built with Subjective C. Every visitor uses the same URL, place inventory, and semantic actions. Searches and in-session choices change the page's hierarchy, language, metrics, recommendations, density, and visual interpretation.

From the repository root:

```bash
npm run dev
```

Try these searches without changing the URL:

- `a quiet sunset hike with ocean views`
- `drinks in the Marina with a group of friends`
- `somewhere to dance to house music`
- `an intimate Italian date in North Beach`
- `show my parents around without too much walking`

Use **Why this view?** to see the evidence behind the current interpretation or reset the session model. Evidence is bounded and stored in session storage by default. No demographic or sensitive attributes are inferred.

The config demonstrates the adaptation contract:

```js
export default {
  adaptation: {
    storage: "session",
    defaultIntent: "discover",
    intents: [
      {
        id: "outdoors",
        label: "Outside mode",
        interpretation: "golden-gate",
        keywords: ["hike", "trail", "sunset"]
      }
    ]
  },
  data: {
    // canonical data shared by every visitor
    experiences: {
      // intent-specific presentation and content layers
      outdoors: { hero, metrics, items, activity }
    }
  }
};
```

The generated runtime exposes `window.SubjectiveC.recordVisitorSignal(signal)` and `window.SubjectiveC.resetAdaptation()` for host integrations. Canonical navigation is untouched; adaptation does not push query parameters or rewrite history.
