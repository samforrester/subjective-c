# `.subjective` source specification

## Goals

The source format should be readable by non-developers, diff cleanly in Git, remain useful without a model, and preserve enough structure for deterministic compilation.

## Minimal source

```subjective
# Atlas

Build a simple place for customers to review their documents.
```

## Full source

```subjective
# Atlas

Build a trustworthy document portal for financial clients.

## Must
- Keep upload and download available
- Make document status unambiguous

## Prefer
- Show the latest documents first

## Avoid
- Dense admin language

## Adapt
- First-time users should see explanations
- Advisors should get a compact table

## Audience
- Financial clients
- Advisors

## Tone
- Trustworthy
- calm
- professional

## Data
- Documents with name, owner, status, date, and category

## Actions
- Upload a document
- Search documents
- Download a document

## Navigation
- Overview
- Documents
- Requests
- Settings
```

## Section semantics

| Section | Meaning |
| --- | --- |
| `Purpose`, `Goal`, `Intent`, `Brief` | Product outcome |
| `Must`, `Required`, `Invariants`, `Always` | Hard constraints |
| `Prefer`, `Preferences`, `Should` | Soft constraints |
| `Avoid`, `Never`, `Do not` | Negative constraints |
| `Adapt`, `Context`, `Personalization` | Context rules |
| `Audience`, `Users`, `People` | Intended users |
| `Tone`, `Feel`, `Style`, `Personality` | Desired character |
| `Actions`, `Capabilities`, `Features`, `Jobs` | Semantic actions |
| `Data`, `Content`, `Entities` | Domain objects |
| `Navigation`, `Pages`, `Screens` | Stable destinations |

## Freeform English

Headings are optional. The local compiler classifies sentences beginning with terms such as `must`, `always`, `prefer`, `avoid`, `never`, `adapt`, `for new users`, and `for power users`.

Structured sections are recommended because they produce cleaner diffs and fewer ambiguous classifications.

## Configuration

`subjective.config.js` contains runtime and build settings that do not belong in the product brief:

```js
import { defineConfig } from "subjective-c";

export default defineConfig({
  novelty: 0.72,
  devtools: true,
  inspectorOpen: true,
  context: {
    experience: "returning",
    device: "auto",
    motion: "auto",
    contrast: "auto"
  },
  data: {
    metrics: [],
    items: [],
    activity: []
  }
});
```

An application may also provide a custom `provider` object with an asynchronous `compile` method.
