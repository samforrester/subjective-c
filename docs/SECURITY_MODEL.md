# Security model

## Trust boundaries

- `.subjective` source and provider output are untrusted data.
- The manifest must validate before planning.
- The component/action registry is application-owned trusted code.
- A plan may reference only registered component and action IDs.
- The runtime emits semantic action requests; the host owns authorization and execution.

## Enforced in the current alpha

- Provider-controlled values are escaped before HTML interpolation.
- Static builds ship a restrictive script/object/base Content Security Policy.
- `domain.icon` rejects markup and oversized glyphs.
- Capability and navigation identifiers are validated and unique.
- Required capabilities must remain reachable in every accepted plan.
- Reachability is derived from selected component capabilities, not mere registry membership.
- Permissioned actions fail closed unless a host authorizer explicitly returns `true`.
- Destructive actions require normalized confirmation copy and an approval step before emission.
- Application theme tokens reject CSS rule delimiters and unsafe identifiers.
- Preference storage accepts only known density, motion, contrast, and safe palette values.
- Build output defaults inside the project and rejects project root, filesystem root, and the user home directory.
- External output requires `allowExternalOutDir: true` or `--allow-external-out-dir`.
- Builds stage all files before atomically replacing the last successful output.
- CI exercises security regressions, semantic cohorts, keyboard/browser behavior, reduced motion, axe, package contents, and performance budgets.

## Host responsibilities

The runtime's authorization and confirmation gates prevent accidental client-side dispatch, but they are not a service authorization boundary. Re-check permissions in the application or service that executes the action. Use a restrictive Content Security Policy, avoid secrets in generated data or preferences, and conduct an independent review before exposing sensitive workflows.

Report vulnerabilities using the private process in [`../SECURITY.md`](../SECURITY.md), not a public issue.
