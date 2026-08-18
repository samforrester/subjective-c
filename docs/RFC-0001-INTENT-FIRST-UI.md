# RFC 0001: Intent-first user interfaces

- Status: Experimental
- Authors: Subjective C contributors
- Target: 0.1–1.0

## Summary

Introduce a web-framework architecture in which product intent compiles into a validated manifest and a constrained runtime selects a context-appropriate interface interpretation.

## Motivation

Most frontend systems make layout and presentation deterministic while treating user context as a narrow source of responsive overrides. Language models make it possible to express higher-level product intent, but directly generating arbitrary code or DOM creates correctness, security, reproducibility, and maintainability problems.

This RFC proposes an intermediate representation and a policy-limited runtime.

## Proposal

A Subjective C application contains:

1. English source describing purpose, constraints, adaptation, tone, domain, and actions.
2. A compiler or provider that emits a versioned manifest.
3. A variant engine that combines the manifest with context, novelty, and a seed.
4. A component runtime that renders only known, validated primitives.
5. A semantic event layer that connects generated controls to application behavior.

## Invariants

A conforming runtime must:

- Preserve every required capability
- Preserve stable action identifiers and labels unless explicitly allowed to rewrite them
- Produce deterministic variants from identical inputs
- Respect reduced-motion and contrast context
- Expose the current seed and interpretation identifier
- Keep business effects outside generated presentation
- Make compiler and runtime versions inspectable

## Non-goals

The first version does not attempt to:

- Generate arbitrary application code
- Replace domain models, authorization, or state management
- Learn from users automatically
- Move destructive actions unpredictably
- Guarantee that every English phrase is understood
- Produce a unique design system for every application

## Alternatives

### Generate React code from a prompt

This is flexible but difficult to validate, patch, reproduce, and safely execute. It also couples interpretation to a specific framework.

### Use a conventional schema-driven UI

This is safe and deterministic but often moves pixel specification into JSON. Subjective C adds intent, policy, context, and controlled variation above the schema layer.

### Personalize a fixed interface with feature flags

This works for known variants but scales poorly when every adaptation requires manual design and implementation. Subjective C treats composition as a constrained search space.

## Open questions

- How should a component registry describe semantic and accessibility capabilities?
- What policy language can prove required elements remain reachable?
- How much variation can occur before muscle memory degrades?
- Which adaptations require explicit user consent?
- How should learned preferences be stored, explained, and reset?
- Can server rendering preserve deterministic hydration across variants?
