# Vite CLI 测试套件

测试代码作为独立的 pnpm workspace 包运行，覆盖脚手架单元逻辑、模板叠加、生成项目构建、浏览器运行时和完整合法组合矩阵。

## 目录结构

```text
__test__/
├── helpers/
│   └── test-utils.ts
├── unit/
│   ├── core/
│   ├── generators/
│   ├── helpers/
│   └── utils/
├── e2e/
│   ├── featureCombination/
│   │   ├── feature-combination.spec.ts
│   │   └── helpers/
│   ├── build-smoke.spec.ts
│   ├── full-matrix.spec.ts
│   ├── husky-hooks.spec.ts
│   ├── qiankun-lifecycle.spec.ts
│   └── standard-browser.spec.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 测试分层

### 单元测试

单元测试覆盖 capability registry、配置归一化、生成前拒绝非法组合、atom 合并、最终输出、模板渲染、依赖排序和文件辅助函数。

非法配置测试会验证 `emptyDir()`、模板渲染和最终输出均未执行，确保错误不会清空已有目标目录。

### 快速 E2E

`pnpm test:e2e` 不包含 384 组合全矩阵，包含以下可执行验证：

- 模板结构、导入边界和依赖声明检查。
- Vue/React × standard/qiankun × manualRoutes/pageRoutes 的 8 个代表项目。
- 8 个项目的 install、type-check、ESLint 和 build smoke。
- Vue/React × 两种路由的 4 个 standard 浏览器场景。
- Vue/React × 两种路由的 4 个真实 qiankun host 场景，验证嵌套 activeRule、mount、unmount 和 remount。
- ESLint 开启和关闭时的 2 个真实 Husky 提交场景。

浏览器测试同时收集 page error、console error、失败请求和 HTTP 错误响应；standard 产物还验证 `/app/` base 下的页面和静态资源。

### 完整合法组合矩阵

`pnpm test:matrix` 从 capability registry 推导组合域，不扫描目录来决定哪些能力可选。当前共有 384 个合法组合：

```text
2 framework
× 1 framework-specific UI
× 2 route mode
× 2 runtime mode (standard / qiankun)
× 3 package manager
× 2^4 optional feature state (i18n / sentry / eslint / husky)
= 384
```

每个组合真实执行：

1. 生成项目并验证入口、依赖和 standard/qiankun 纯净性。
2. 使用所选 pnpm、npm 或 Yarn 安装依赖。
3. 运行类型检查。
4. 启用 ESLint 时运行生成项目的 ESLint。
5. 构建并验证 `/app/assets/*.js` 和 `dist/assets`。

npm 使用在线优先的 registry metadata，避免旧缓存把合法 semver range 解析到 registry 中不存在的版本；pnpm 和 Yarn 使用离线优先并在缓存未命中时访问 registry。

## 运行命令

从仓库根目录运行：

```bash
# 单元测试
pnpm test:unit

# 快速 E2E，不含 full matrix
pnpm test:e2e

# 单元测试 + 快速 E2E
pnpm test

# 完整 384 组合
pnpm test:matrix

# 类型检查与 lint
pnpm type-check
pnpm lint
```

浏览器用例需要 Chromium：

```bash
pnpm --filter @moluoxixi/vite-cli-test exec playwright install chromium
```

## 矩阵分片

CI 将 384 个组合拆成 12 个互斥 shard，每个 shard 32 个组合：

```powershell
$env:MATRIX_SHARD_COUNT='12'
$env:MATRIX_SHARD_INDEX='0'
pnpm test:matrix
```

`MATRIX_SHARD_INDEX` 的合法范围是 `0..MATRIX_SHARD_COUNT-1`。分配规则为全局组合索引对 shard 数取模，因此所有 shard 的并集恰好覆盖完整矩阵且互不重复。

## 关键契约

- Vue 只生成 `src/main.ts`，React 只生成 `src/main.tsx`。
- standard 产物不得包含 qiankun import、依赖或生命周期代码。
- qiankun 产物必须支持独立运行和真实 host 生命周期。
- `manualRoutes` 与 `pageRoutes` 必须恰好启用一个。
- Vue 固定投影到 Pinia，React 固定投影到 Zustand。
- Vue UI 为 Element Plus，React UI 为 Ant Design。
- 生成项目不得残留 `catalog:`、`atom.mjs`、内部 `src/main/` 或 `vite/` loader 目录。
- 生成项目不得依赖 `@moluoxixi/vite-config`。
- Husky 与 ESLint 可以独立选择；没有 ESLint binary 时 pre-commit 不执行 lint-staged。

## 执行策略

Vitest 默认配置：

- 每个测试最多 10 分钟。
- hook 最多 3 分钟。
- 网络型 E2E 允许重试 1 次。
- `maxWorkers` 和 `maxConcurrency` 均为 2。
- JUnit 输出到 `__test__/test-results/junit.xml`。

完整矩阵会进行大量真实安装，必须预留网络和磁盘空间。临时项目位于系统临时目录，测试在 `finally` 中清理，并校验待删除目录必须位于系统临时目录且名称属于当前测试前缀。

## CI

`.github/workflows/ci.yml` 使用固定 Node 22.14.0、npm 10.9.0、Yarn 1.22.22 和根 `pnpm-lock.yaml`：

- lint 与 type-check。
- 240 个单元测试。
- Ubuntu、Windows、macOS 快速 E2E。
- Ubuntu 上的 12 个 full-matrix shard。

根锁文件必须提交，否则 `pnpm install --frozen-lockfile` 会在干净 checkout 中失败。
