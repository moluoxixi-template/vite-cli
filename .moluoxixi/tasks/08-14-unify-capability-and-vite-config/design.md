# Technical Design

## Boundaries

`src/core/capabilities.ts` owns the supported capability graph. `src/constants/index.ts` remains the compatibility export layer used by prompts and tests, but derives all option arrays from the registry. `src/core/projectConfig.ts` owns normalization and validation. `src/generators/project.ts` calls it before any filesystem mutation. Template rendering and atom composition keep the existing directory layering; the final output renderer gains explicit Vue/React and standard/qiankun branches.

The external `@moluoxixi/vite-config` package is treated as a reference and optional future integration. Its dependency-driven addon registry is useful for Vite plugin metadata, but its current Vite 7 peer baseline and missing CLI-specific page-route/qiankun semantics make direct runtime adoption unsafe in this iteration.

## Capability contract

The registry will use literal typed records:

- framework: `enabled`, supported UI libraries, state feature, micro-frontend engines;
- route modes: the canonical feature key and exactly-one constraint;
- package managers: existing supported values;
- disabled values remain typed for template history but are not exported as selectable capabilities.

The validation result is a `ProjectConfigType` with route booleans normalized from `routeMode`. Validation errors are ordinary `Error` instances with a stable `能力配置无效:` prefix and field names suitable for CLI output.

## Data flow

```text
prompt / programmatic config
  -> normalizeProjectConfig (normalize + validate)
  -> generateProject(normalized)
  -> render templates and atoms
  -> transparent main.ts + vite.config.ts
```

Validation happens once at the generator boundary. Feature-specific file discovery remains responsible for deciding whether a physically present template exists; the registry is responsible for whether the requested combination is legal.

## Compatibility and rollback

The default Vue + Element Plus behavior is preserved. React is enabled only after its Ant Design, router, standard entry, qiankun entry and Vite contributions pass executable verification. Standard and micro-frontend output remain separately governed: standard output never imports a micro-frontend helper, while qiankun output reuses framework features and adds only lifecycle-specific contributions from `templates/<framework>/micro-frontends/qiankun`.

Router base is a lifecycle contract rather than an app-code convention. Standard projects derive their base from `VITE_APP_CODE`; qiankun projects prefer a string `activeRule` supplied at lifecycle props (top-level or legacy `data.activeRule`) and only fall back to the standard base. Non-string qiankun active rules remain host matching rules and are not passed to framework routers.

The exhaustive matrix is derived per framework from the registry. Route flags and state management are projections, not independent axes. UI libraries are conditional framework domains. User-selectable i18n, Sentry, ESLint and Husky values are boolean axes. Package-manager combinations are retained and the executable suite accepts deterministic shard index/count environment variables for CI. Every matrix output runs a lint gate: ESLint-enabled projects use their generated script, while ESLint-disabled projects use the repository's shared config against generated source files without changing their output dependencies.

## Verification

Unit tests cover registry derivation, normalization, renderer modes and no-write-before-validation. Output tests cover four framework/runtime entry families. Fast build smoke covers both routers for Vue/React standard/qiankun. The exhaustive matrix covers every legal feature/package-manager combination and is shardable. Browser tests verify standard routing; a real qiankun host verifies mount, unmount, remount and arbitrary activeRule behavior.
