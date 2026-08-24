# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

<!--
Document your project's quality standards here.

Questions to answer:
- What patterns are forbidden?
- What linting rules do you enforce?
- What are your testing requirements?
- What code review standards apply?
-->

(To be filled by the team)

---

## Forbidden Patterns

<!-- Patterns that should never be used and why -->

(To be filled by the team)

---

## Required Patterns

<!-- Patterns that must always be used -->

(To be filled by the team)

---

## Testing Requirements

<!-- What level of testing is expected -->

(To be filled by the team)

---

## Code Review Checklist

<!-- What reviewers should check -->

(To be filled by the team)

---

## Scenario: Exporting The Capability Matrix To Static Artifacts

### 1. Scope / Trigger

Apply this contract when a test, release workflow, documentation site, or other consumer needs generated projects for every supported capability combination. It prevents a hand-maintained gallery or download list from drifting away from the CLI's executable matrix.

### 2. Signatures

The shared production boundary is:

```typescript
generateConfigMatrix(options?: ConfigMatrixOptions): ConfigMatrixEntry[]
createConfigMatrixSlug(config: ConfigMatrixEntry['config']): string
```

The quality matrix may enable artifact export with these environment keys:

```text
MATRIX_SHARD_COUNT=<positive integer>
MATRIX_SHARD_INDEX=<integer in 0..count-1>
MATRIX_EXPORT_DIR=<absolute or workspace-relative output directory>
TEMPLATE_GALLERY_BASE_PATH=/<repository-name>/
```

### 3. Contracts

- `src/core/capabilities.ts` remains the only capability registry.
- `src/core/configMatrix.ts` owns legal combination enumeration and stable public slugs.
- Test helpers may re-export the production matrix API; they must not copy its Cartesian-product implementation.
- A matrix entry is exported only after generate, install, type-check, lint, build, and build-output verification succeed.
- Each concurrent combination writes only to `entries/<slug>/` and produces `demo/`, `source.zip`, `stackblitz.json`, and `metadata.json`.
- Source ZIP and StackBlitz files use the same sorted source-entry collection. ZIP keeps lockfiles and `.env`; StackBlitz omits package-manager lockfiles because its WebContainer installs from `package.json`. Both exclude `node_modules`, `dist`, `.git`, caches, logs, and generated Husky internals.
- StackBlitz payloads are runtime-specific derivatives, not byte-for-byte ZIP mirrors. Set `VITE_APP_CODE` to an empty value so Vite and the application router serve from `/`, and include `.stackblitzrc` with `{"startCommand":"npm run dev"}`. Preserve the original `.env` in ZIP downloads.
- Public URLs use the slug, never shard indexes or random temporary directories.
- The Pages assembler validates the expected slug set, shard count, commit, artifact presence, artifact sizes, and total site-size threshold before upload.

### 4. Validation & Error Matrix

| Condition | Required behavior |
|---|---|
| Shard index is outside the shard count | Throw before generating projects |
| Two entries resolve to the same slug | Fail assembly; never overwrite |
| A shard or expected slug is missing | Fail assembly; never deploy a partial site |
| Entry commit differs from the workflow head SHA | Fail assembly |
| Demo, ZIP, or StackBlitz payload is missing or empty | Fail assembly |
| Source file cannot be decoded as UTF-8 for StackBlitz | Fail export and include the relative path |
| StackBlitz payload lacks `.env`, `package.json`, a string `scripts.dev`, or `.stackblitzrc` | Fail export / assembly |
| StackBlitz payload keeps a non-empty `VITE_APP_CODE` | Fail validation; the default Preview opens `/`, not the generated subpath |
| StackBlitz `startCommand` differs from `npm run dev` | Fail validation |
| Site exceeds the configured Pages size threshold | Fail before `upload-pages-artifact` |
| `MATRIX_EXPORT_DIR` is absent | Preserve the ordinary matrix test behavior and emit no artifacts |

### 5. Good / Base / Bad Cases

- Good: a 12-shard Publish run exports unique artifacts, then one Pages workflow assembles the complete manifest from the same workflow run and commit.
- Base: local matrix tests omit `MATRIX_EXPORT_DIR`; they continue to build with the template's normal `/app/` base.
- Bad: a gallery script hard-codes 384 records or regenerates combinations independently from `generateConfigMatrix()`.
- Bad: a workflow deploys whichever shards happen to exist after a matrix failure.

### 6. Tests Required

- Unit: current combination count, legal normalization, and slug uniqueness.
- Unit: ZIP exclusions, lockfile preservation, UTF-8 rejection, and metadata without `targetDir`.
- Unit: StackBlitz `.env` uses an empty app code, `.stackblitzrc` selects `npm run dev`, and `package.json.scripts.dev` remains present.
- Unit: assembler shard count, expected slug set, commit equality, artifact completeness, recomputed sizes, and capacity failure.
- Unit: parse workflow YAML and assert shard list, unique artifact names, cross-run download inputs, and minimum Pages permissions.
- Smoke: run one real matrix combination with export enabled and assert Demo, ZIP, StackBlitz, and metadata are produced after a successful build.
- Browser E2E: materialize a fresh project only from the StackBlitz `files` map, install dependencies, start the payload's dev server, request `/`, and assert a real framework menu/title renders without page or network errors. Opening the StackBlitz editor alone is not sufficient.
- Remote: the complete matrix remains the authoritative all-combination validation.

### 7. Wrong vs Correct

#### Wrong

```typescript
const galleryTemplates = [
  { framework: 'vue', routeMode: 'pageRoutes' },
  // A second capability list that will drift.
]
```

#### Correct

```typescript
const entries = generateConfigMatrix()
for (const entry of entries) {
  const slug = createConfigMatrixSlug(entry.config)
  // Export only after this entry's quality gates pass.
}
```
