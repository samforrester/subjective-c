# Releasing

The current supported tag is `v0.3.0-alpha.1`. Do not describe the project as production-ready.

```bash
npm ci
npm run browser:install
npm run release:check
git status --short
```

`release:check` runs unit/security tests, 120 semantic plan cohorts, the Orbit build, doctor, browser and axe checks, compiler/planner benchmarks, and `npm pack --dry-run` budgets for all five packages.

Review the generated tarball file lists and changelog, create a signed tag, then let the tag workflow repeat the release gate. Package publication should remain manual until trusted npm publishing and provenance are configured for the repository.
