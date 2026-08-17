# Component Guidelines

> How components are built in this project.

---

## Overview

<!--
Document your project's component conventions here.

Questions to answer:
- What component patterns do you use?
- How are props defined?
- How do you handle composition?
- What accessibility standards apply?
-->

(To be filled by the team)

---

## Component Structure

<!-- Standard structure of a component file -->

(To be filled by the team)

---

## Props Conventions

<!-- How props should be defined and typed -->

(To be filled by the team)

---

## Styling Patterns

### Convention: Use Public Component-Library Styling Contracts

Use the component library's default theme, documented props, and public theme tokens before adding application CSS. Do not target internal implementation classes such as `.el-menu`, `.el-menu-item`, or `.el-sub-menu__title` from generated templates.

For Element Plus templates:

- Load the native theme through `@use 'element-plus/theme-chalk/src/index.scss' as *;`.
- Set application-level theme tokens, such as `--el-color-primary`, at a layout boundary when runtime theme selection is required.
- Prefer native component props for behavior and layout where the component exposes them.
- Do not use `:deep(.el-*)`, global `.el-*` selectors, or `!important` to recreate menu states.

This keeps generated projects compatible with Element Plus markup changes and prevents standard and qiankun templates from drifting.

```vue
<!-- Correct: native component behavior plus a public theme token. -->
<div :style="{ '--el-color-primary': themeColor }">
  <ElMenu mode="horizontal" router>
    <SubMenu :routes="routes" />
  </ElMenu>
</div>
```

```scss
// Wrong: depends on undocumented internal structure and specificity.
:deep(.el-menu) {
  .el-menu-item.is-active {
    color: #fff !important;
  }
}
```

Required regression assertions for generated standard and micro-frontend layouts:

- generated layout text does not contain `:deep(.el-` or feature-specific global `.el-*` overrides;
- generated Element Plus stylesheet contains only the approved native theme entry;
- generated projects pass Vue standard and qiankun type-check/build smoke tests.

---

## Accessibility

<!-- A11y requirements and patterns -->

(To be filled by the team)

---

## Common Mistakes

### Reimplementing Component States in Scoped CSS

Overriding normal, hover, active, and popup states through nested internal selectors couples templates to the library's rendered DOM. Remove the overrides and use native states unless a product requirement explicitly needs a documented theme-token customization.
