# Implementation Plan

1. Add typed capability registry and derive constants/options from it.
2. Add project configuration normalization and validation; call it before `emptyDir` and pass the normalized config through generation/finalization.
3. Add focused unit tests for registry derivation, invalid combinations, and no-mutation-on-failure; update output fixtures only where normalization changes defaults.
4. Add root lint/unit/e2e scripts, use frozen lockfile in CI, and add a minimal generated-project build smoke test.
5. Run type-check, lint, unit tests, smoke test, and the relevant E2E subset; inspect the final diff for cross-layer drift.
6. Repair Vue router-base and Element Plus runtime contracts.
7. Complete React standard/qiankun main output and React feature atoms/templates, then enable React and qiankun in the registry.
8. Replace the global Cartesian helper with a per-framework legal-combination enumerator covering all optional booleans and package managers.
9. Add standard browser and real qiankun host lifecycle coverage for Vue and React; make the full executable matrix shardable.
10. Run repository gates, four-family smoke, lifecycle tests and the complete legal matrix.

## Completed

- Added the typed capability registry and registry-derived prompt/constants surface.
- Added generator-boundary normalization and validation before `emptyDir()`.
- Preserved transparent generated `vite.config.ts` output and the no-black-box dependency contract.
- Added root quality scripts, a root workspace lockfile for frozen CI installs, and build smoke coverage.
- Added and corrected regression tests for invalid preflight behavior, normalized downstream config, and `.yarnrc.yml` handling.
- Completed Vue/React standard and qiankun renderers without changing the existing template layering model.
- Added framework-specific UI, router, state, i18n and Sentry output, plus real qiankun host lifecycle coverage.
- Added the registry-derived 384-combination executable matrix and 12 deterministic CI shards.
- Made Husky independent from ESLint and covered both states with real Git commits.
- Made npm matrix installs prefer current registry metadata to avoid stale-cache `ETARGET` failures.

## Validation Results

- `pnpm install --frozen-lockfile`: passed with the committed root lockfile.
- `pnpm type-check`: passed.
- `pnpm lint`: passed.
- `pnpm test:unit`: passed, 240/240 tests.
- `pnpm test:e2e`: passed, 183/183 tests across 6 files.
- Build smoke: passed, 8/8 generated projects (Vue/React × standard/qiankun × manual/page routes).
- Standard browser smoke: passed, 4/4.
- Real qiankun host lifecycle: passed, 4/4 including nested `/tenant/child` activeRule and remount.
- Husky real commit coverage: passed, 2/2 with ESLint disabled/enabled.
- Full legal matrix: passed, 384/384 across 12 shards of 32 combinations.
- Package-manager coverage: local pnpm 10.8.0, npm 11.17.0, and Yarn 1.22.22 across every legal capability state; CI pins npm 10.9.0 for the same matrix.

## Knowledge Proposals

- `20260814080845-scaffolding-capabilities-d016b4`: executable capability and pre-write validation contract.
- `20260814080845-index-7f6a3f`: backend spec index entry.

## Validation commands

- `pnpm type-check`
- `pnpm lint`
- `pnpm test:unit`
- `pnpm test:e2e -- --run ...` (targeted smoke first)

## Risk points

- Existing tests construct `ProjectConfigType` directly and may depend on route flags being independently set.
- `FRAMEWORKS` drives template validation and E2E generation; changing its source must preserve the current Vue matrix.
- Do not add `@moluoxixi/vite-config` to generated dependencies until its Vite peer range is aligned with template Vite and page-route/qiankun coverage exists.
