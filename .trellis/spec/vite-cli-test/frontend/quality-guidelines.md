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
- Source ZIP and StackBlitz files use the same sorted source-entry collection. ZIP keeps lockfiles and the original `.env` files. StackBlitz omits source lockfiles, `node_modules`, `dist`, `.git`, caches, logs, and generated Husky internals; its explicit pnpm install produces a fresh runtime lockfile.
- StackBlitz payloads are runtime-specific derivatives, not byte-for-byte ZIP mirrors. The platform treats root `.env` as a special encrypted-settings file and does not preserve SDK-submitted content as a normal project file. Do not submit root `.env`, and keep `.env.development` / `.env.production` identical to the generated template.
- Read the generated project's real root `.env`, set `VITE_APP_CODE=` so Vite and the application router serve from `/`, and add `VITE_STANDALONE=true` only for qiankun. Base64-encode that complete root env in `.stackblitzrc.startCommand`; echo it to a temporary file, decode the file with Node into root `.env`, remove the temporary file, then run pnpm install/dev. Do not pipe echo to Node stdin: StackBlitz's startup shell exposes that descriptor as `EBADF`.
- Overwrite `package.json.packageManager` with `pnpm@10.8.0`, remove `sass-embedded` while keeping pure-JS `sass`, and set `installDependencies:false`. Apply this derivative to every matrix entry, even when the downloadable project uses npm or Yarn; preserve the original package-manager metadata, env files, and dependencies in ZIP downloads.
- A qiankun StackBlitz payload's injected root env must contain `VITE_STANDALONE=true`. The generated Vite config must skip `vite-plugin-qiankun` in this mode; React qiankun projects must register the React Vite plugin during standalone development.
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
| StackBlitz payload lacks either mode env, `package.json`, a string `scripts.dev`, or `.stackblitzrc` | Fail export / assembly |
| StackBlitz payload contains root `.env` | Fail validation; StackBlitz filters it at the platform boundary |
| Either mode env contains root-only `VITE_APP_CODE`, `VITE_APP_TITLE`, or `VITE_STANDALONE` | Fail validation; mode env files must match the generated template |
| StackBlitz `packageManager` differs from `pnpm@10.8.0` | Fail validation |
| StackBlitz enables automatic dependency installation or its command does not generate root `.env` before the explicit pnpm install/start command | Fail validation |
| StackBlitz keeps `sass-embedded` or lacks pure-JS `sass` | Fail validation; WebContainer cannot execute the embedded Dart binary |
| The echo-injected root env lacks `VITE_APP_TITLE`, empty `VITE_APP_CODE`, or qiankun `VITE_STANDALONE=true` | Fail validation |
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
- Unit: StackBlitz removes root `.env`, leaves both mode env files unchanged, decodes the echo-injected root env to the expected template values and StackBlitz overrides, explicitly selects pnpm install/start, removes `sass-embedded`, and keeps `sass`.
- Unit: runtime validation rejects contaminated mode env files, missing injected root values, root `.env`, `sass-embedded`, and the legacy npm runtime contract.
- Unit: assembler shard count, expected slug set, commit equality, artifact completeness, recomputed sizes, and capacity failure.
- Unit: parse workflow YAML and assert shard list, unique artifact names, cross-run download inputs, and minimum Pages permissions.
- Smoke: run one real matrix combination with export enabled and assert Demo, ZIP, StackBlitz, and metadata are produced after a successful build.
- Browser E2E: materialize Vue standard, Vue qiankun, and React qiankun projects only from the StackBlitz `files` map; assert root `.env` is initially absent and both mode env files lack root-only values; execute the exact payload `startCommand`; then assert root `.env` was generated from the template env with title/base/standalone values before checking framework DOM. Do not replace the command with separate test-side install/dev calls.
- Remote StackBlitz: local materialization is necessary but not sufficient. Click the gallery action, confirm the terminal actually runs the explicit pnpm command, inspect the uploaded file tree, and assert the StackBlitz Preview iframe contains framework DOM after the server starts. Opening the editor or observing an open port is not acceptance. Reload Preview once after startup if StackBlitz created the iframe before Vite became ready.
- Remote: the complete matrix remains the authoritative all-combination build validation; representative real StackBlitz Preview checks remain the authoritative platform-boundary validation.

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

const stackblitzFiles = {
  ...generatedTextFiles,
  '.env.development': generatedTextFiles['.env.development'],
  '.env.production': generatedTextFiles['.env.production'],
  '.stackblitzrc': JSON.stringify({
    installDependencies: false,
    startCommand: createStackBlitzStartCommand(
      Buffer.from(stackblitzRootEnv, 'utf-8').toString('base64'),
    ),
  }),
  'package.json': JSON.stringify({
    ...generatedPackageJson,
    packageManager: 'pnpm@10.8.0',
    devDependencies: {
      ...generatedPackageJson.devDependencies,
      'sass-embedded': undefined,
    },
  }),
}
delete stackblitzFiles['.env']
```
