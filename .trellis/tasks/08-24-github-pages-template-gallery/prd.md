# GitHub Pages 全量模板展厅

## Goal

为 `vite-cli` 提供一个由 GitHub Pages 托管的模板展厅。用户可以在主界面搜索和筛选全部合法能力组合，并对每个组合直接执行三种操作：打开独立在线 Demo、下载固定源码 ZIP、在 StackBlitz 新标签页中打开完整代码游乐场。

## Background

- 正式能力由 `src/core/capabilities.ts` 维护，测试矩阵通过 `__test__/e2e/featureCombination/helpers/test-config-generator.ts` 从能力注册表派生。
- 当前完整矩阵是 384 个合法组合：框架、UI、路由模式、standard/qiankun、包管理器以及 i18n、Sentry、ESLint、Husky 四个布尔能力的笛卡尔积。
- `__test__/e2e/full-matrix.spec.ts` 已对每个组合执行生成、安装、lint、type-check 和 build；`.github/workflows/publish.yml` 已把完整矩阵拆成 12 个 shard。
- 仓库 `templates/` 是脚手架叠加原材料，不是可直接部署的完整项目。完整项目必须经过 `generateProject()` 合并 common、framework、feature 和 micro-frontend 层后产生。
- GitHub Pages 只部署一次。主页、384 个 Demo、384 个 ZIP、384 份 StackBlitz 源码清单和总 manifest 都属于同一个 Pages artifact。

## Requirements

### R1. 单一矩阵数据源

展厅条目必须从与完整质量矩阵相同的能力组合生成逻辑派生，不维护第二份手写清单。新增或禁用框架、UI、路由、微前端、包管理器或布尔能力后，展厅数量和筛选项应自动变化。

### R2. 全量独立 Demo

每个合法组合都必须构建并部署自己的 Demo，不按运行时结果去重。每个 Demo 使用包含完整组合标识的独立 Pages base，静态资源和路由不得与其他组合冲突。

公开地址形态：

```text
/demos/<template-slug>/
```

### R3. 固定源码 ZIP

每个合法组合必须提供一份固定 ZIP。ZIP 来自该组合已经通过安装、lint、type-check 和 build 的生成目录，包含对应包管理器 lockfile；排除 `node_modules/`、`dist/`、`.git/`、缓存、日志和临时构建文件。

公开地址形态：

```text
/downloads/vite-template-<template-slug>.zip
```

### R4. StackBlitz 代码游乐场

每个组合提供“在 StackBlitz 打开”操作，在新标签页调用官方 `StackBlitzSDK.openProject()`。项目使用 `template: 'node'`，源码、依赖和 scripts 来自同一生成目录；无需站点 API Token。StackBlitz 数据按组合懒加载，不把 384 份源码全部塞入主页首屏。

StackBlitz 不读取 ZIP。流水线必须为每个组合额外生成扁平的文本文件映射，并在发现无法表示的必要二进制文件时明确失败。

### R5. 模板目录主界面

主界面是实际可用的模板目录，不制作营销落地页。桌面端采用紧凑的筛选区和结果列表，移动端使用可收起筛选面板。至少支持：

- 按 framework、UI、runtime、route、package manager、i18n、Sentry、ESLint、Husky 筛选；
- 按组合名称搜索；
- 显示当前命中数量、分页并支持清空筛选；
- 筛选和页码进入 URL query，刷新和分享后保持状态；
- 每条结果直接提供 Demo、ZIP、StackBlitz 三个操作，不增加中间详情页；
- 使用 Vue 3、Element Plus 原生组件样式和 `@lucide/vue` 图标，不覆盖 `.el-*` 组件内部样式。

### R6. 稳定公开标识

公开 URL 不使用 shard 序号或随机临时目录。每个组合采用带 schema 版本的 ASCII slug，完整编码所有能力轴：

```text
v1-<framework>-<ui>-<runtime>-<route>-<package-manager>-i<0|1>-s<0|1>-e<0|1>-h<0|1>
```

manifest 保存原始完整配置、slug、Demo/ZIP/StackBlitz 地址、构建 commit 和制品大小。

### R7. 分片导出与单次部署

复用现有 12 个 full-matrix shard。每个组合只在质量验证通过后导出 Demo、ZIP、StackBlitz 数据和 metadata；各 shard 上传名称唯一的中间 artifact。后续 Pages 工作流合并所有 shard，验证组合总数、slug 唯一性和文件完整性，再执行一次 GitHub Pages 部署。

### R8. 容量与完整性门禁

GitHub Pages 发布站点存在 1 GB 上限。部署前必须输出总大小、Demo/ZIP/StackBlitz 分类大小和最大组合，并在超过可配置安全阈值时失败。禁止静默丢弃组合或只部署部分矩阵。

## Acceptance Criteria

- [ ] 主界面条目数量与当前完整合法矩阵一致，当前为 384，且每个 slug 唯一。
- [ ] 384 个条目都具有独立且可访问的 `/demos/<slug>/`，资源路径不会落到共享 `/app/` 或其他组合目录。
- [ ] 384 个条目都能下载对应源码 ZIP；抽检 ZIP 不含 `node_modules`、`dist`、`.git`，并含项目源码、`package.json` 和对应 lockfile。
- [ ] 384 个条目都能在新标签页打开 StackBlitz；项目文件、依赖和 dev script 可加载，Preview 根路径能渲染应用，且无需站点 Token。
- [ ] 搜索、全部筛选项、分页、清空筛选和 URL query 状态在桌面及移动端可用。
- [ ] 每条结果直接提供 Demo、ZIP、StackBlitz 三个操作，没有额外详情页。
- [ ] full-matrix 的生成、lint、type-check、build 和制品导出共享同一次组合执行，未复制第二份矩阵定义。
- [ ] 汇总 job 在部署前验证总 manifest、组合数、slug、三类制品和容量阈值；任一缺失时阻止部署。
- [ ] GitHub Pages 通过一次部署发布完整站点，并由 Playwright 验证主页、筛选、三种操作链接和代表性 Vue/React、standard/qiankun Demo。

## Out of Scope

- 不创建 384 个独立仓库或 384 个 GitHub Pages 站点。
- 不提供浏览器端自由勾选能力后实时生成 ZIP；ZIP 是流水线生成的固定矩阵制品。
- 不在主站内嵌 StackBlitz iframe；代码游乐场始终在新标签页打开。
- 不部署仓库 `templates/` 片段目录；只部署 `generateProject()` 产生的完整项目。
