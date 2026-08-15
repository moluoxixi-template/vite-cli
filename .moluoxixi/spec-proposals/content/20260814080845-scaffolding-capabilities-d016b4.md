# Scaffolding Capability Contracts

> Executable contracts for declaring supported project combinations and validating them before generation.

## Scenario: Add or change a scaffold capability

### 1. Scope / Trigger

Apply this contract when adding, enabling, disabling, or renaming a framework, UI library, route mode, state-management feature, micro-frontend engine, or package manager.

`src/core/capabilities.ts` is the runtime source of truth for supported combinations. Historical template types may remain expressible, but disabled capabilities must not appear in prompts, generated test matrices, or other runtime option exports.

### 2. Signatures

```ts
export function normalizeProjectConfig(config: ProjectConfigType): ProjectConfigType

export async function generateProject(config: ProjectConfigType): Promise<void>
```

The capability graph is exposed through these literal registries:

```ts
FRAMEWORK_CAPABILITIES
ROUTE_MODE_CAPABILITIES
MICRO_FRONTEND_ENGINE_CAPABILITIES
PACKAGE_MANAGER_CAPABILITIES
```

Compatibility exports in `src/constants/index.ts` must derive their selectable values from those registries.

### 3. Contracts

- `normalizeProjectConfig()` is the only generator-boundary normalizer.
- `generateProject()` must call it before `emptyDir()` or any template/output write.
- `routeMode` deterministically projects to exactly one route feature flag.
- The framework deterministically projects to exactly one state-management flag.
- UI libraries and micro-frontend engines are legal only when enabled globally and listed by the selected framework.
- Disabled historical types may be accepted by TypeScript declarations but must fail runtime normalization.
- Validation errors are `Error` instances whose message starts with `能力配置无效:` and names the conflicting field.
- Generated projects own a transparent `vite.config.ts` and direct Vite plugin dependencies. They must not receive `@moluoxixi/vite-config`, internal atom loaders, or template-only `atom.mjs` files.
- Vue and React each have separate standard and qiankun renderers. Standard output must not contain qiankun imports, dependencies, globals, or lifecycle code.
- Qiankun output must run independently and under a real host. A non-empty string `props.activeRule` is the router base; legacy `props.data.activeRule` is a fallback, and function active rules remain host-only matchers.
- Legal-combination tests must derive framework-specific UI, route, state, and micro-frontend domains from the registry. Route and state flags are projections, not independent Cartesian axes.
- CI uses the committed root `pnpm-lock.yaml` with `pnpm install --frozen-lockfile`.

### 4. Validation & Error Matrix

| Input condition | Result |
|---|---|
| Framework is disabled or unknown | Reject with `framework` or `不支持的框架` in the message |
| UI library is disabled or absent from the framework | Reject with `uiLibrary` and `framework` in the message |
| Route mode is disabled or absent from the framework | Reject with `routeMode` and `framework` in the message |
| Explicit route flag disagrees with `routeMode` | Reject and name the conflicting route flag |
| Explicit state flag disagrees with the framework projection | Reject and name the conflicting state flag |
| `microFrontend` is true without an engine | Reject and name `microFrontendEngine` |
| Engine is disabled or absent from the framework | Reject with `microFrontendEngine` and `framework` in the message |
| `microFrontend` is false but an engine is supplied | Reject and name `microFrontendEngine` |
| Package manager is disabled or unknown | Reject and name `packageManager` |
| Legal configuration | Return a new normalized config without mutating the input |

Every rejection above must happen before the target directory is cleared or written.

### 5. Good / Base / Bad Cases

#### Good

Vue + Element Plus + `pageRoutes` + qiankun normalizes to `pageRoutes: true`, `manualRoutes: false`, `pinia: true`, and `zustand: false`, then generates a buildable project.

#### Base

Vue + Element Plus + `manualRoutes` with micro-frontends disabled normalizes route/state flags and removes an absent engine without changing template output semantics.

#### Bad

Vue + Ant Design Vue while that UI capability is disabled, either framework + micro-app while that engine is disabled, or `microFrontend: true` without an engine must throw before `emptyDir()`.

### 6. Tests Required

- Registry derivation tests assert the exact public framework, UI, route, engine, and package-manager values.
- Normalization unit tests cover every row in the validation matrix and assert normalized route/state flags.
- Generator boundary tests mock `emptyDir`, template rendering, and final output writing, then assert none run for an invalid config.
- Output contract tests assert generated projects omit `@moluoxixi/vite-config`, internal Vite loader directories, and `atom.mjs`.
- Build smoke tests cover Vue/React × standard/qiankun × manualRoutes/pageRoutes.
- Browser smoke tests cover both frameworks and route modes under `/app/`; qiankun tests use a real host and verify mount, unmount, remount, nested activeRule, page errors, console errors, and network failures.
- The executable matrix covers all 384 legal combinations across pnpm, npm, and Yarn. It performs install, type-check, conditional ESLint, build, and dist validation and supports deterministic CI sharding.
- npm matrix installs use current registry metadata rather than stale offline metadata; cached metadata must not be allowed to create false `ETARGET` failures.
- Before merge, run `pnpm install --frozen-lockfile`, `pnpm type-check`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:e2e`, and all `pnpm test:matrix` shards.

### 7. Wrong vs Correct

#### Wrong

```ts
export const FRAMEWORKS = ['vue', 'react']

await emptyDir(config.targetDir)
await renderTemplate(config)
```

This duplicates support declarations and can erase the target before discovering an illegal combination.

#### Correct

```ts
export const FRAMEWORKS = FRAMEWORK_ORDER.filter(
  framework => FRAMEWORK_CAPABILITIES[framework].enabled,
)

const normalizedConfig = normalizeProjectConfig(config)
await emptyDir(normalizedConfig.targetDir)
await renderTemplate(normalizedConfig)
```

The same capability graph now drives selection and validation, and filesystem mutation only begins after validation succeeds.
