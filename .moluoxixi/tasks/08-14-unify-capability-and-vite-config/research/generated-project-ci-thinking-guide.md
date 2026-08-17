# Generated Project CI Thinking Guide

> **Purpose**: Catch runner and generated-tooling assumptions before a change reaches a release workflow.

## Before Changing CI or Executable Tests

- [ ] Does every command-line package also need an external binary or operating-system dependency installed?
- [ ] Are optional lint/compiler rules enabled only when their plugin or tool is registered?
- [ ] Do generated dependency declarations match every plugin referenced by generated configuration?
- [ ] Are temporary paths short and independent from descriptive test names or user input?
- [ ] Does the workflow exercise Linux, Windows, and macOS where the release gate claims cross-platform support?
- [ ] Are downstream jobs blocked until the entire required matrix succeeds?

## External Tool Provisioning

Package installation does not always install executable assets. Browser automation,
native compilers, and platform-specific runtimes may require an explicit install step.

```yaml
- name: Install Chromium with dependencies
  if: runner.os == 'Linux'
  run: pnpm --filter <test-package> exec playwright install --with-deps chromium

- name: Install Chromium
  if: runner.os != 'Linux'
  run: pnpm --filter <test-package> exec playwright install chromium
```

Check the workflow that actually invokes the tool. A setup step in pull-request CI
does not provision a separate Publish workflow.

## Optional Plugin Contracts

A configuration rule and its plugin registration form one contract. Do not emit a
framework-specific rule into projects where dependency detection leaves the plugin
unregistered.

```ts
// Wrong: disabling can still require ESLint to resolve the missing plugin.
rules: { 'vue/block-order': 'off' }

// Correct for a composer-based temporary compatibility fix: remove the rule.
eslintConfig(options).removeRules('vue/block-order')
```

Prefer fixing the configuration package that owns the rule. When that package cannot
be released in the same change, keep the repository-local compatibility fix explicit
and protect it with generated-output plus executable lint coverage.

## Windows Path Budget

Temporary directory uniqueness and diagnostic naming are separate concerns. Keep the
full case name in the test suite, logs, and project metadata, but use a fixed short
filesystem prefix.

```ts
// Wrong: dependency managers append deeply nested paths to this value.
createTempDir(`test-${testCase.name}-`)

// Correct: timestamp/random suffixes already provide uniqueness.
createTempDir('vite-cli-fc-')
```

Estimate the final path after package-manager stores, native binaries, snapshots, and
build output are appended, not only the initial temporary directory.

## Verification Matrix

- Good: all supported operating systems install required external assets, generated tools reference only available plugins, and temporary paths remain short.
- Base: a pure unit-test job with no external executable may only need dependency installation.
- Bad: one workflow passes because another workflow installed a browser; a missing plugin rule is merely set to `off`; or a full parameterized case name is embedded in a Windows temp path.

Required assertion points:

- Generated output contains the compatibility rule removal and does not add unrelated plugin dependencies.
- The workflow contains an operating-system-appropriate external asset installation before the command that launches it.
- Executable generated-project tests retain descriptive suite names while using a fixed short temporary prefix.
- Remote matrix results are checked per job before release jobs are allowed to continue.
