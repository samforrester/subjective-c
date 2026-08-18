# Contributing

Subjective C is an architectural experiment. Contributions should make the system more understandable, reproducible, safe, and useful rather than merely increasing visual randomness.

## Setup

```bash
npm install
npm test
npm run build:example
npm run dev
```

The repository requires Node.js 20.11 or newer and intentionally has no third-party runtime dependencies in 0.1.

## Repository layout

- `packages/core`: compiler, validation, providers, and variant engine
- `packages/runtime`: browser renderer, styles, interactions, and inspector
- `packages/cli`: scaffolding, builds, dev server, and inspection tools
- `packages/create-subjective-c`: `npm create` bootstrap command
- `examples/orbit`: reference application
- `docs`: architecture, specification, RFCs, and roadmap
- `schemas`: machine-readable manifest and variant schemas

## Change process

Small bug fixes may go directly to a pull request. Open an issue or RFC before changing manifest semantics, provider contracts, variation policy, stable anchors, or the runtime action model.

Every behavior change should include a test. Variant changes should remain deterministic for a seed. Runtime changes should preserve semantic HTML and keyboard access.

## Design principles

- Prefer manifest changes over hidden runtime heuristics.
- Keep domain behavior separate from generated composition.
- Never make required or destructive actions harder to find for novelty.
- Add explanation whenever the runtime makes a consequential choice.
- Keep the core dependency-free unless a strong case is documented.
- Treat accessibility as policy, not polish.

## Pull requests

Explain the user problem, the invariant being protected, the new behavior, test coverage, and any compatibility impact. Include screenshots or seed values for visual changes when possible.
