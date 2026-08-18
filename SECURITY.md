# Security policy

## Supported versions

Subjective C is currently an experimental 0.x project. Security fixes are applied to the latest source version only.

## Reporting a vulnerability

Do not open a public issue for a vulnerability involving code execution, path traversal, secret exposure, manifest injection, cross-site scripting, provider authentication, or unsafe generated actions. Contact the repository maintainers privately through the security-reporting channel configured on the hosting platform.

Include a minimal reproduction, affected version or commit, impact, and suggested mitigation when available.

## Current trust model

- `.subjective` source and config are trusted build inputs.
- Provider responses are untrusted and validated structurally, but 0.1 does not yet perform complete content sanitization or policy proof.
- Runtime text is HTML-escaped before rendering.
- Business effects remain outside the generated runtime and should enforce their own authorization.
- Provider secrets must remain in the Node build environment and must never be placed in the manifest or browser data.

Do not deploy the alpha to sensitive workflows without an independent security review.
