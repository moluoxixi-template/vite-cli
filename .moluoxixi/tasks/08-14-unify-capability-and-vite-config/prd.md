# 统一多技术栈能力约束与 Vite 配置生成边界

## Goal

让脚手架对当前正式支持的能力给出单一、可验证的声明，并在生成前拒绝非法组合；同时修复 CI 入口漂移，使生成项目经过类型检查和受控的构建冒烟验证。保持生成项目直接拥有透明的 `vite.config.ts`，不把 `@moluoxixi/vite-config` 强制变成运行时黑盒依赖。

## Background

- `FrameworkType` 仍声明 `vue | react`，但 `FRAMEWORKS` 由仅开放 Vue 的 UI 配置推导，且最终输出函数明确拒绝 React（`src/types/index.ts:13`、`src/constants/index.ts:31-46`、`src/core/projectOutput.ts:173-176,328-331`）。
- `ProjectConfigType` 同时保存路由枚举和路由布尔字段，也允许微前端 engine 缺失；生成器只校验 framework，feature 渲染按任意 `true` 字段扫描（`src/types/index.ts:33-70`、`src/generators/project.ts:95-124`、`src/core/feature.ts:192-211`）。
- atom Vite 贡献目前是字符串数组，存在隐式覆盖和缺少冲突模型的问题（`src/core/projectAtom.ts:24-28,164-190`）。
- 根 `package.json` 没有 CI 调用的 `lint`、`test:unit`、`test:e2e` scripts；组合 E2E 的 build 断言目前被禁用（`package.json:18-39`、`__test__/e2e/featureCombination/feature-combination.spec.ts:241-251,312-360`）。
- `D:/project-new/vue-component/packages/vite-config` 已提供依赖驱动的 addon registry、显式缺依赖失败和配置合并能力，但当前 peer catalog 以 Vite 7 为基线，脚手架模板固定 Vite 6.2.4；本任务只复用其设计边界，不直接恢复黑盒依赖。

## Requirements

### R1. Capability registry

建立一个由源码维护的能力 registry，至少描述当前正式开放的 framework、UI library、route mode、micro-frontend engine、package manager，以及 framework 与 feature 的兼容关系。`FRAMEWORKS`、`UI_LIBRARIES`、`ROUTE_MODES`、`MICRO_FRONTEND_ENGINES` 和 prompt 选项必须从该 registry 派生；未完成的 React、Ant Design 和 micro-app 不得被误报为可生成能力。

### R2. Normalize and validate before rendering

在 `emptyDir()` 之前归一化并校验配置：路由模式必须恰好一个；开启微前端时必须提供当前 framework 可用的 engine；UI library 必须属于 framework；状态管理 feature 必须与 framework 匹配；不支持的 framework 或未知 engine 必须给出明确错误。校验失败不得修改目标目录。

### R3. Preserve transparent output

保持现有透明 `vite.config.ts`、直接依赖 Vite 插件和 atom 输出契约。此次不把 `@moluoxixi/vite-config` 写入生成项目依赖；为后续可选 preset 保留清晰边界和兼容性注释。

### R4. Complete React output

在保持现有目录叠加顺序的前提下，补齐 React standard 与 qiankun 两套独立入口、React Router、Ant Design、Zustand、i18n、Sentry 和对应 Vite 插件贡献。standard 产物不得包含 qiankun 代码；qiankun 产物必须支持独立运行以及 mount/unmount/remount，并从生命周期 props 获取任意字符串 router base。

### R5. Repair Vue runtime contracts

统一 Vue standard/qiankun 的 router base 规则，修复 Element Plus 类型与 RouterView/Transition 运行时警告，并保证 arbitrary qiankun activeRule 不再被 `VITE_APP_CODE` 隐式覆盖。

### R6. Exhaustive legal-combination coverage

组合测试必须从 capability registry 按 framework 推导 UI、route 和 micro-frontend 域，枚举所有用户可选布尔 feature 状态。每个合法组合至少完成生成、产物契约、依赖契约和入口静态验证；完整可执行矩阵完成 install、lint（启用时）、type-check 与 build。standard 与 qiankun 另有浏览器 smoke，qiankun 另有真实 host 的 mount/unmount/remount 和 arbitrary activeRule 验证。

### R7. Repair quality gates

增加与 CI 一致的根 scripts，CI 安装使用 frozen lockfile，并提供可分片的完整组合门禁以及快速 smoke 门禁。

### R8. Regression coverage

为 registry、配置归一化、非法组合拒绝、生成前不清空目录、Vue 标准/qiankun 最终输出和 CI script 契约增加单元或轻量集成测试；保持现有“不生成 `@moluoxixi/vite-config`/atom.mjs/vite 目录”的契约。

## Acceptance Criteria

- [x] 所有公开 prompt 常量从单一 capability registry 派生；Vue/React 只显示各自已验证的 UI、route 和 qiankun 能力。
- [x] 合法 Vue 标准和 qiankun 配置行为与当前输出兼容。
- [x] 非法路由、UI/framework、微前端 engine 和状态管理组合在 `emptyDir` 前失败，错误包含具体冲突字段。
- [x] 生成器单测证明校验失败时不会调用 `emptyDir`、模板渲染或最终输出写入。
- [x] 根 `pnpm type-check`、`pnpm lint`、`pnpm test:unit`、`pnpm test:e2e` 均有对应 script；CI 使用 `--frozen-lockfile`。
- [x] Vue/React 的 standard 与 qiankun、manualRoutes 与 pageRoutes 均通过生成、type-check、build 和浏览器 smoke。
- [x] React standard 产物不含 qiankun 代码；React/Vue qiankun 均通过真实 host mount、unmount、remount 和非 appCode activeRule 验证。
- [x] 完整合法组合矩阵覆盖所有可选 feature 状态和三种 package manager，且支持 CI 分片执行。
- [x] 生成项目完整 ESLint、`pnpm type-check`、`pnpm lint`、目标单测、smoke 和全矩阵测试通过。

## Out of Scope

- 本任务不把 `@moluoxixi/vite-config` 直接加入生成项目依赖，也不解决其 Vite 6/7 peer 兼容矩阵。
- 本任务不实现 micro-app，也不开放尚未完成的 Vue Ant Design Vue 模板。
- 本任务不改变 `common/base -> framework/base -> framework/features -> framework/micro-frontends/<engine>/base -> .../features` 的目录叠加模型。
