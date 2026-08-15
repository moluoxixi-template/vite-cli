# Bug Analysis: React pageRoutes fails on qiankun remount with single-spa 5

## 1. Root Cause Category

- **Category**: D - Test Coverage Gap, with an E - Implicit Assumption component.
- **Specific Cause**: The qiankun host E2E aliased `single-spa` to the test package's direct `single-spa@6` dependency. `qiankun@2.10.16` declares `single-spa@^5.9.2`, so the test changed the host scheduler instead of exercising qiankun's normal dependency contract. Under single-spa 5, remounting React pageRoutes directly onto an unloaded lazy route happened inside a synchronous navigation update; the generated qiankun entry called `root.render()` without `startTransition`, and React 18 rejected the suspension.

## 2. Why Earlier Validation Failed

1. **Standalone browser smoke**: It proved the qiankun child could run by itself, but never entered the host lifecycle branch.
2. **Existing host lifecycle E2E**: It covered mount, unmount, and remount, but its `single-spa@6` alias changed the scheduling behavior and hid the compatibility failure.
3. **Build, type-check, and lint**: The generated code was statically valid; the error only existed at the React lazy-route, qiankun lifecycle, and host scheduler boundary.
4. **First demo-host attempt**: Installing single-spa 6 beside qiankun loaded two single-spa copies. The browser warning identified the harness error, but aligning the host to single-spa 5 then exposed the real generated-entry bug.

## 3. Prevention Mechanisms

| Priority | Mechanism | Specific Action | Status |
|---|---|---|---|
| P0 | Architecture | Wrap React qiankun initial render in `startTransition` so lazy-route suspension is not treated as a synchronous input update. | DONE |
| P0 | Test coverage | Run qiankun lifecycle E2E against single-spa 5, matching qiankun 2's declared host contract. | DONE |
| P0 | Test assertion | Keep page errors, console errors, failed requests, and HTTP error responses as success-path assertions. | DONE |
| P1 | Review checklist | When a host integration test aliases a transitive runtime, compare that alias version with the integration package's declared dependency range. | PROPOSED |
| P1 | Matrix coverage | Keep both manualRoutes and pageRoutes in real host mount/unmount/remount coverage because their lazy-loading behavior differs. | DONE |

## 4. Systematic Expansion

- **Similar Issues**: micro-app or future host engines can be falsely validated if tests replace their router, scheduler, sandbox, or lifecycle runtime with a newer direct dependency.
- **Design Improvement**: Treat the host runtime dependency graph as part of a micro-frontend capability contract, not as test-only implementation detail.
- **Process Improvement**: For every micro-frontend engine, verify standalone mode and real host mode separately, and make at least one host case use the engine's normal supported runtime versions.
- **Knowledge Gap**: Static checks cannot prove asynchronous route behavior across a synchronous host lifecycle. Browser lifecycle tests must include a cold lazy route on remount.

## 5. Knowledge Capture

- [x] Added executable output assertions for `startTransition` in the React qiankun renderer.
- [x] Aligned the qiankun host E2E with single-spa 5.
- [x] Prepared a complete code-spec candidate in `research/scaffolding-capabilities.md`.
- [ ] Human review and promotion of the pending spec proposal.
