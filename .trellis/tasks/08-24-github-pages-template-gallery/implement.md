# Implementation Plan

1. 提取可复用的合法矩阵枚举与 `v1` slug 生成逻辑，让现有测试生成器和 Pages 导出共享同一数据源；补充组合数量、字段映射和 slug 唯一性单测。
2. 为 full-matrix 增加由 `MATRIX_EXPORT_DIR` 控制的可选导出能力：独立 Demo base、源码 ZIP、StackBlitz 文本清单和 metadata；保持未设置环境变量时的现有测试行为。
3. 增加导出单测，覆盖 ZIP 排除项、lockfile 保留、StackBlitz 文本文件校验、metadata 完整性和并发目录隔离。
   - StackBlitz 载荷必须额外覆盖根路径 base、显式 startCommand，并通过“载荷重新物化 → install → dev server → browser render”的运行 E2E。
4. 新增 `gallery/` Vue 3 应用，使用 Element Plus 原生组件和 `@lucide/vue` 图标完成搜索、分面筛选、分页、URL query 同步以及 Demo/ZIP/StackBlitz 三个操作。
5. 增加 gallery 的类型检查、lint、单元测试和构建脚本；为最长组合名称、窄屏筛选、空结果、加载失败和 StackBlitz 弹窗受阻状态提供完整 UI。
6. 修改 Publish full-matrix job：为 12 个 shard 设置独立导出目录，并在成功后上传唯一命名的中间 artifacts。
7. 新增 Pages 汇总工作流：监听已完成且未取消的 Publish、下载对应 run 的 12 个 artifacts、校验 manifest 和 384 份三类制品、输出容量报告、构建 gallery、生成 SPA fallback、上传并部署唯一 Pages artifact。
8. 添加 workflow/manifest 静态契约测试，防止 artifact 名、shard 数、Pages 权限、公开路径与矩阵枚举漂移。
9. 运行仓库 lint、type-check、unit 和针对性导出测试；本地只生成代表性 Vue/React、standard/qiankun 组合验证制品，不运行完整 384 矩阵。
10. 启动 gallery 本地服务，使用 Playwright 对桌面和移动视口做截图与交互验证，检查筛选、分页、文本溢出、三种操作和代表性 Demo 路由。
11. 推送后监控远程 Publish 的三平台 test、security、12 个 full-matrix、npm release，以及随后 Pages 汇总/部署，直到全部成功；核验公开 Pages URL、代表性 ZIP 和 StackBlitz 打开流程。

## Validation Commands

实施时根据新增 package scripts 使用以下门禁：

```text
pnpm lint
pnpm type-check
pnpm test:unit
pnpm --filter <gallery-package> lint
pnpm --filter <gallery-package> type-check
pnpm --filter <gallery-package> test
pnpm --filter <gallery-package> build
pnpm --filter @moluoxixi/vite-cli-test test:matrix-export-smoke
```

完整 384 矩阵只在 GitHub Actions 的现有 12 shard 门禁中执行。

## Risk Points

- `VITE_APP_CODE` 同时控制 Vite base 和 router base；每个组合必须由独立子进程环境传值，不能在并发测试中修改全局 `process.env`。
- 12 个 shard 不能写同名顶层 manifest；每组合写独立 metadata，汇总 job 最后生成总 manifest。
- GitHub Pages 1 GB 和 10 分钟部署上限必须在上传前检查。
- StackBlitz SDK 只接受文本文件映射；未来模板引入必要二进制资源时必须显式设计转换方案，不能静默遗漏。
- workflow_run 必须 checkout 与 artifacts 相同的 `head_sha`，避免主页代码与矩阵制品版本不一致。
