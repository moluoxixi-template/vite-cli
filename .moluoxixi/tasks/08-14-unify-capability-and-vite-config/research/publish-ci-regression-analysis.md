## Bug Analysis: Publish workflow cross-platform regressions

### 1. Root Cause Category

- **Category**: D/E - Test Coverage Gap and Implicit Assumption
- **Specific Cause**: The generated ESLint wrapper assumed every project that received a Vue rule also had the Vue plugin; the Publish workflow assumed installing the Playwright package installed Chromium; and the feature-combination suite assumed descriptive test names were safe filesystem prefixes on Windows.

### 2. Why Fixes Failed

1. Earlier local validation covered unit behavior but did not execute the Publish workflow on all three operating systems.
2. The generated-project matrix validated dependency minimality, but the upstream ESLint wrapper added a framework-specific rule outside that dependency contract.
3. Full combination names improved test output but were also copied into temporary paths, coupling diagnostics to an operating-system path limit.

### 3. Prevention Mechanisms

| Priority | Mechanism | Specific Action | Status |
|----------|-----------|-----------------|--------|
| P0 | Test coverage | Keep generated-project lint, type-check, and build in the remote full matrix | DONE |
| P0 | CI provisioning | Install Playwright Chromium explicitly in every Publish test runner | DONE |
| P0 | Architecture | Remove unsupported plugin rules instead of adding unrelated framework plugins | DONE |
| P1 | Cross-platform paths | Keep descriptive names in test metadata and use fixed short temporary-directory prefixes | DONE |
| P1 | Code review | Review external binary installation, optional-plugin rules, and Windows path budgets when changing CI | PROPOSED |

### 4. Systematic Expansion

- **Similar Issues**: Other tools with downloaded runtimes, optional ESLint plugins, and package-manager cache paths can fail for the same reasons.
- **Design Improvement**: Treat generated dependency declarations and generated tool configuration as one contract; a rule must not reference a plugin absent from that contract.
- **Process Improvement**: Use remote operating-system matrices as the authoritative verification for release workflows and keep local test paths independent from diagnostic labels.

### 5. Knowledge Capture

- [x] Prepared `generated-project-ci-thinking-guide.md` as a complete guide candidate.
- [x] Prepared `guides-index-with-cross-platform.md` as a complete index candidate.
- [x] Submitted proposals `20260817082044-generated-project-ci-thinking-gu-37e3f3` and `20260817082044-index-4baca7`.
- [ ] Leave promotion to human `spec-review`.
