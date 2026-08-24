# Technical Design

## Architecture

实现分为四个边界：矩阵标识与导出、分片制品、展厅前端、Pages 汇总部署。

```text
capability registry
  -> generateTestConfigs()
  -> 12 个 full-matrix shard
     -> generate/install/lint/type-check/build
     -> demo + source.zip + stackblitz.json + metadata.json
  -> shard artifacts
  -> Pages 汇总 job
     -> manifest 校验 + 容量门禁 + gallery build
  -> 单一 github-pages artifact
  -> GitHub Pages deploy
```

## Matrix Identity

新增生产可复用的矩阵描述模块，能力域仍以 `src/core/capabilities.ts` 为唯一事实来源。测试生成器和 Pages 制品生成共同消费该模块，避免把 `__test__` helper 变成生产脚本依赖。

`templateSlug` 完整编码当前所有轴并带 `v1` schema。公开 URL 只依赖 slug，不依赖 shard。manifest 中额外保存未压缩的配置字段，前端筛选不解析 slug。

## Build And Export

`full-matrix.spec.ts` 保持质量门禁职责，通过 `MATRIX_EXPORT_DIR` 可选开启制品导出：

1. 生成组合项目。
2. 安装对应包管理器依赖并产生 lockfile。
3. 执行 type-check 和 lint。
4. 以 `VITE_APP_CODE=vite-cli/demos/<slug>` 构建，使 Vite asset base 与 router base 指向该独立子路径。
5. 验证构建后 `index.html` 使用预期 base。
6. 复制 `dist` 为组合 Demo。
7. 从生成目录创建源码 ZIP，执行明确排除规则。
8. 将源码文本扁平化为 StackBlitz `files`，验证必要文件可表示。
9. 写入组合 metadata 后清理临时项目。

组合并发时只写自己的 slug 目录，不共同读写一个 JSON 文件。最终 manifest 由汇总 job 扫描所有独立 metadata 生成。

## Artifact Layout

每个 shard 的内部结构：

```text
entries/<slug>/
├── demo/**
├── source.zip
├── stackblitz.json
└── metadata.json
```

最终 Pages artifact：

```text
index.html + gallery assets
demos/<slug>/**
downloads/vite-template-<slug>.zip
stackblitz/<slug>.json
manifest.json
404.html
```

`404.html` 与 Demo 入口注入轻量 history 恢复逻辑，使 GitHub Pages 下的嵌套路由刷新能回到对应 Demo，而不是落入总站 404。

## Gallery Frontend

新增独立 `gallery/` workspace，使用 Vue 3、TypeScript、Vite、Element Plus 和 `@lucide/vue`。页面使用组件库原生控件，应用自身只负责布局、密度、品牌色和响应式，不通过 `.el-*` 选择器修改内部组件样式。

前端启动后加载 `/vite-cli/manifest.json`。筛选状态由 URL query 驱动，结果采用分页列表；384 条数据不需要虚拟滚动。StackBlitz SDK 按用户首次点击时动态加载；随后 fetch 对应 `stackblitz/<slug>.json` 并调用：

```ts
StackBlitzSDK.openProject(project, {
  newWindow: true,
  view: 'default',
  openFile: framework === 'vue' ? 'src/App.vue' : 'src/App.tsx',
})
```

StackBlitz project 使用 `template: 'node'`，`files` 包含生成后的 `package.json`，依赖不重复写入 SDK 的 EngineBlock `dependencies` 字段。

StackBlitz Preview 默认打开服务根路径，因此载荷对生成源码执行专用变换：`.env` 中 `VITE_APP_CODE` 置空，使 Vite base 和 Vue/React router base 都为 `/`；新增 `.stackblitzrc` 并显式设置 `startCommand: npm run dev`。该变换不写回 ZIP 或 Pages Demo。

## Workflow Boundaries

`.github/workflows/publish.yml` 的 full-matrix job 继续负责验证并上传 12 份唯一命名的 shard artifact。新增 Pages workflow 监听已完成且未取消的 Publish workflow，通过 `run-id` 下载同一提交的 shard artifacts，checkout 对应 `head_sha` 构建 gallery，汇总并部署。即使 npm release 独立失败，只要 12 个 shard 全部存在且通过汇总校验，展厅仍可发布；矩阵失败时缺失 shard 会阻止 Pages 部署。

这样不会再运行一次 384 矩阵，也不会把 Pages 发布故障耦合进 npm release。build job 使用 `contents: read`、`actions: read` 和首次启用站点所需的 `pages: write`；deploy job 仅使用 `pages: write`、`id-token: write`。

## Limits And Failure Policy

GitHub Pages 发布站点上限为 1 GB，部署过程上限为 10 分钟。当前已有代表性 dist 约 0.6 MB，384 个 Demo 的粗略量级约 230-260 MB，仍需以真实汇总结果为准。

汇总阶段提供默认低于 1 GB 的安全阈值并输出分类统计。超过阈值、组合数不一致、同名 slug、缺失 Demo/ZIP/StackBlitz 文件或 StackBlitz 必需二进制文件均直接失败；不做隐式去重或降级部署。

## Compatibility And Rollback

- 普通本地 full-matrix 未设置 `MATRIX_EXPORT_DIR` 时保持现有行为，不产生发布制品。
- ZIP 中保留生成项目的正常本地 `.env`；Pages 专用 base 只在 build 子进程环境中覆盖，不写回下载源码。
- 删除 Pages workflow 和 gallery workspace 即可停止站点发布，不影响 CLI 生成和 npm release。
