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

React while its framework capability is disabled, Vue + Ant Design Vue while that UI capability is disabled, or `microFrontend: true` without an engine must throw before `emptyDir()`.

### 6. Tests Required

- Registry derivation tests assert the exact public framework, UI, route, engine, and package-manager values.
- Normalization unit tests cover every row in the validation matrix and assert normalized route/state flags.
- Generator boundary tests mock `emptyDir`, template rendering, and final output writing, then assert none run for an invalid config.
- Output contract tests assert generated projects omit `@moluoxixi/vite-config`, internal Vite loader directories, and `atom.mjs`.
- Build smoke tests generate, install, and build at least one standard Vue page-route project and one Vue qiankun project.
- Before merge, run `pnpm install --frozen-lockfile`, `pnpm type-check`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, and `pnpm test:build-smoke`.

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

## Scenario: Validate a micro-frontend against its real host runtime

### 1. Scope / Trigger

Apply this contract when adding or changing a micro-frontend renderer, route implementation, lifecycle adapter, or real-host E2E. Standalone browser smoke is necessary but does not validate the host lifecycle branch.

### 2. Signatures

Generated React qiankun entries retain the lifecycle contract:

```ts
function render(props: QiankunProps = {}): void

renderWithQiankun({
  bootstrap(): Promise<void>
  mount(props: QiankunProps): Promise<void>
  unmount(): Promise<void>
  update(): Promise<void>
})
```

The real-host E2E must exercise:

```text
active route -> outside activeRule -> cold lazy route under activeRule
mount        -> unmount            -> remount
```

### 3. Contracts

- A qiankun child must work in standalone mode and through a real qiankun host.
- React qiankun rendering must wrap the initial `reactRoot.render()` call in `startTransition()` so a cold lazy route may suspend during single-spa 5 navigation.
- The host test's single-spa major must match the range supported by the tested qiankun major. For `qiankun@2.10.16`, use `single-spa@^5.9.2`; do not silently replace it with single-spa 6.
- The host must pass a non-default nested string `activeRule` through lifecycle props and the child router must use it as its basename.
- Success requires zero page errors, console errors, failed requests, and HTTP responses with status 400 or greater.

### 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Child opened outside a host | Render normally using `VITE_APP_CODE` as its route base |
| Host mounts under a nested string activeRule | Render home route inside the host container |
| Host leaves activeRule | Unmount the React root and clear the lifecycle state |
| Host remounts directly on a cold lazy route | Render the route without the React synchronous-suspense error |
| Host runtime major differs from the engine contract | Fail review or test setup; do not treat the result as compatibility evidence |
| Page/console/network error occurs | Fail the browser lifecycle test |

### 5. Good / Base / Bad Cases

- **Good**: qiankun 2 + single-spa 5 mounts `/tenant/child/home`, unmounts at `/outside`, and remounts directly at `/tenant/child/about` with `关于` visible and no browser errors.
- **Base**: The same generated child opens standalone at its `VITE_APP_CODE` base and renders both home and about routes.
- **Bad**: The test aliases single-spa 6 while claiming qiankun 2 compatibility, or only asserts that `dist/index.html` exists.

### 6. Tests Required

- Output unit test: React standard output does not contain `startTransition`; React qiankun output imports and calls it.
- Real-host E2E: React manualRoutes and pageRoutes both run mount, unmount, and remount against single-spa 5.
- The pageRoutes remount target must be a cold lazy route, not the route loaded during the first mount.
- Assert mount/unmount counters, final pathname, visible route heading, and empty page/console/network error collections.
- Keep standalone browser smoke separate so standard and qiankun independent-run contracts remain visible.

### 7. Wrong vs Correct

#### Wrong

```ts
// Test dependency changes qiankun 2's normal scheduler and can hide failures.
alias: {
  qiankun: require.resolve('qiankun'),
  'single-spa': require.resolve('single-spa@6'),
}

root.render(<RouterProvider router={router} />)
```

#### Correct

```ts
// Host dependency stays within qiankun 2's supported single-spa 5 range.
startTransition(() => {
  reactRoot.render(<RouterProvider router={router} />)
})
```
