# Philosophy

## The frontend is usually overspecified

Most application interfaces encode product intent indirectly through thousands of implementation decisions: hierarchy, coordinates, breakpoints, component choices, copy length, density, visibility, and interaction patterns. Those decisions produce consistency, but they also freeze assumptions about every user and context.

Subjective C moves some of those decisions from author time to interpretation time.

The developer still defines the product. They specify the domain, required actions, constraints, safety rules, adaptation policy, and allowed component vocabulary. The runtime may select among valid expressions of that product.

## Subjective does not mean arbitrary

A useful subjective system has three layers:

1. **Truth:** domain semantics, data, permissions, state, and action effects.
2. **Policy:** invariants, accessibility, allowed variation, risk, and context rules.
3. **Expression:** layout, density, grouping, copy detail, visual hierarchy, and treatment.

Only the third layer should vary freely. The second constrains it. The first must remain correct.

## The refresh demo is a test harness

A new interpretation on every refresh is intentionally extreme. It makes variation visible and forces the framework to confront muscle memory, accessibility, and semantic stability.

A mature system should use context, learning, and explicit policy rather than novelty for its own sake. Most users should see gradual, explainable adaptation. High-risk workflows should be nearly deterministic.

## The compiler should be inspectable

The output of language models should not jump directly into production DOM. Subjective C inserts an intermediate manifest that can be validated, diffed, cached, tested, signed, reviewed, and reproduced from a seed.

## Application behavior stays outside the generator

The runtime emits semantic actions. Domain code performs them. This means a generated button can move from a card to a command bar without changing the action identifier, authorization rules, or side effects.
