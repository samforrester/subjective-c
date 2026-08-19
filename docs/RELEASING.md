# Releasing

The current supported tag is `v0.4.0-alpha.1`. Do not describe the project as production-ready.

```bash
npm ci
npm run browser:install
npm run release:check
git status --short
```

`release:check` runs unit/security tests, 120 semantic plan cohorts, the reference build, doctor, browser and axe checks, compiler/planner benchmarks, `npm pack --dry-run` budgets, and a clean consumer install of all five package tarballs.

Review the generated tarball file lists and changelog, create a signed tag, then let the tag workflow repeat the release gate.

## First publication

npm requires each package to exist before a trusted publisher can be attached. Publish the first version manually in dependency order: `@subjective-c/core`, `@subjective-c/runtime`, `@subjective-c/react`, `subjective-c`, then `create-subjective-c`. Always target `https://registry.npmjs.org` explicitly when a machine has another default registry.

## Trusted publishing

After the first publication, configure each package's npm trusted publisher with:

- Provider: GitHub Actions
- Organization or user: `samforrester`
- Repository: `subjective-c`
- Workflow filename: `publish.yml`
- Environment: `npm`
- Allowed action: `npm publish`

Protect the GitHub `npm` environment with a required reviewer. Future releases can then run **Publish packages** manually with an existing verified tag and an `alpha` or `latest` distribution tag. The workflow uses npm OIDC, creates provenance automatically, refuses tag/version mismatches, reruns the complete release gate, and publishes in dependency order without a stored npm token.
