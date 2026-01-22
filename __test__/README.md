# Vite CLI 测试套件

本测试套件采用 **monorepo** 管理，作为独立的 workspace 包，使用 Vitest 进行测试，包含单元测试、集成测试和 E2E 测试。

## 📦 Monorepo 结构

```
__test__/                           # 独立的测试 workspace
├── package.json                   # 测试专用依赖
├── tsconfig.json                  # 测试 TypeScript 配置
├── vitest.config.ts               # Vitest 配置
├── helpers/                       # 测试辅助工具
│   └── test-utils.ts             # 通用测试工具
├── unit/                          # 单元测试
│   ├── core/
│   │   └── feature.spec.ts       # Feature 核心功能测试
│   └── utils/
│       ├── deepMerge.spec.ts     # 深度合并测试
│       └── sortDependencies.spec.ts # 依赖排序测试
└── e2e/                          # E2E 测试
    └── featureCombination/      # 功能组合 E2E 测试
        ├── feature-combination.spec.ts # 功能组合测试（包含所有 E2E 测试）
        └── helpers/              # 功能组合测试辅助工具
            ├── dependency-validator.ts # 依赖验证工具
            ├── import-validator.ts # 导入验证工具
            ├── template-validator.ts # 模板验证工具
            └── test-config-generator.ts # 测试配置生成器
```

## 🔧 为什么使用 Monorepo？

1. **依赖隔离**：测试依赖（Vitest、execa 等）不会污染主项目
2. **独立管理**：测试配置、依赖版本独立维护
3. **更快的安装**：主项目不需要安装测试依赖
4. **清晰的边界**：测试代码与源代码完全分离

## 📝 命名约定

测试文件使用 `.spec.ts` 后缀（Specification 规范），遵循 BDD（Behavior-Driven Development）风格：
- ✅ `feature.spec.ts` - 推荐（规范描述）
- ❌ `feature.test.ts` - 不推荐（旧式命名）

这种命名方式强调测试是对代码**行为规范**的描述，而不仅仅是测试。

## 📋 测试内容总览

### 单元测试（Unit Tests）
测试独立的函数和模块，确保基础逻辑正确。

| 测试文件 | 测试内容 | 覆盖范围 |
|---------|---------|---------|
| `unit/utils/deepMerge.spec.ts` | 对象深度合并逻辑 | 对象合并、数组去重、嵌套对象、package.json 合并 |
| `unit/utils/sortDependencies.spec.ts` | 依赖排序功能 | 字母排序、空对象、scoped 包处理 |
| `unit/core/feature.spec.ts` | Feature 映射转换 | UI 库映射、路由模式映射、布尔特性映射 |

**测试场景：** 覆盖所有核心功能的单元测试

### 集成测试（Integration Tests）
集成测试包含在 E2E 测试文件中，专注于验证模板文件的代码隔离性。

**测试内容：**
- **模板结构完整性检查**：验证所有必需的 base 目录和 feature 目录存在
- **文件导入验证**：确保模板文件没有跨模板引用（如 `../../templates/`），保证代码隔离正确
- **包导入声明验证**：所有包导入都在对应模板的 package.json 中声明

**职责说明：** 集成测试专注于验证模板文件的代码隔离性，确保模板之间不会相互引用。项目生成、依赖验证等完整流程由 E2E 测试负责。

**测试范围：** 自动扫描所有模板（Vue/React × base/features × 微前端等），覆盖所有模板的导入路径验证

### E2E 测试（End-to-End Tests）
测试完整的项目生成流程，包括依赖安装、类型检查、构建等。

所有 E2E 测试都集中在 `featureCombination/feature-combination.spec.ts` 文件中，基于文件系统自动扫描生成所有测试组合。

**测试内容：**
- **集成测试部分（模板验证，作为前置检查）**：
  - 模板结构完整性检查：验证所有必需的 base 目录和 feature 目录存在
  - 源代码文件验证：扫描并验证所有源代码文件
  - 文件导入验证：确保没有跨模板导入（代码隔离正确）
  - 包导入声明验证：所有包导入都在对应模板的 package.json 中声明
- **E2E 测试部分（项目生成与验证）**：
  - 项目生成：为每个功能组合生成完整项目
  - package.json 验证：验证文件结构和元数据（type、scripts、dependencies、devDependencies、name、description、author）
  - 依赖安装：`pnpm install` 成功
  - 依赖验证：
    - Catalog 引用解析：所有 `catalog:` 引用都被替换为实际版本号
    - 条件依赖：禁用功能时不应该有对应依赖（如禁用 eslint 时不应有 eslint 依赖）
    - 基础依赖：所有项目都应该有必需的 @moluoxixi 依赖
  - 类型检查：`pnpm type-check` 通过
  - 代码检查：`pnpm lint:eslint` 通过（如果启用了 ESLint）
  - 项目构建：`pnpm build` 成功，生成构建产物（使用 vite.config 中的 outDir）
  - 构建产物验证：dist 包含 index.html 和资源文件

**测试配置：** 自动扫描生成所有功能组合（Vue/React × UI库 × 路由模式 × 微前端 × 包管理器等）

**注意：** E2E 测试运行时间较长（根据测试组合数量，通常 10-30 分钟），需要网络连接。

## 运行测试

### 运行所有测试
```bash
pnpm test
```

### 运行单元测试
```bash
pnpm test:unit
```

### 运行 E2E 测试
```bash
pnpm test:e2e
```

### 运行所有测试（按顺序）
```bash
pnpm test:all
```

### 测试覆盖率
```bash
pnpm test:coverage
```

### 监听模式
```bash
pnpm test:watch
```

### UI 模式
```bash
pnpm test:ui
```

## 测试类型说明

### 1. 单元测试（Unit Tests）

测试独立的函数和模块，运行速度快。

**测试内容：**
- `deepMerge`: 测试对象深度合并逻辑
- `sortDependencies`: 测试依赖排序功能
- `feature`: 测试 feature 映射和配置转换

**运行时间：** < 1 秒

### 2. 集成测试（Integration Tests）

集成测试包含在 E2E 测试文件中，专注于验证模板文件的代码隔离性。

**测试内容：**
- 模板结构完整性检查（所有必需的 base 目录和 feature 目录存在）
- 文件导入验证（确保没有跨模板引用，代码隔离正确）
- 包导入声明验证（所有包导入都在对应模板的 package.json 中声明）

**职责说明：** 集成测试专注于验证模板文件的代码隔离性，确保模板之间不会相互引用。项目生成、依赖验证等完整流程由 E2E 测试负责。

**运行时间：** 10-30 秒（作为 E2E 测试的前置检查）

### 3. E2E 测试（End-to-End Tests）

测试完整的项目生成流程，所有测试都集中在 `featureCombination/feature-combination.spec.ts` 文件中。

**测试内容：**
- **集成测试部分（模板验证，作为前置检查）**：
  - 模板结构完整性检查
  - 源代码文件验证
  - 文件导入验证（无跨模板导入）
  - 包导入声明验证
- **E2E 测试部分（项目生成与验证）**：
  - 项目文件生成（为每个功能组合生成完整项目）
  - package.json 结构和元数据验证
  - 依赖安装成功
  - 依赖验证（Catalog 引用解析、条件依赖、基础依赖）
  - TypeScript 类型检查通过
  - ESLint 检查通过（如果启用）
  - 项目构建成功（使用 vite.config 中配置的 outDir）
  - 构建产物验证

**依赖验证包含：**
- Catalog 引用解析（确保所有 `catalog:` 引用都被替换为实际版本号）
- 条件依赖验证（禁用功能时不应该有对应依赖）
- 基础依赖验证（必需的 @moluoxixi 依赖）

**运行时间：** 根据测试组合数量，通常 10-30 分钟

**注意：** E2E 测试需要网络连接和较长时间，建议在 CI 环境中运行。

## 测试覆盖率目标

- **行覆盖率（Lines）**: ≥ 60%
- **函数覆盖率（Functions）**: ≥ 60%
- **分支覆盖率（Branches）**: ≥ 60%
- **语句覆盖率（Statements）**: ≥ 60%

查看覆盖率报告：
```bash
pnpm test:coverage
# 打开 coverage/index.html 查看详细报告
```

## 测试场景

### Vue 项目测试场景

1. **完整配置**：Element Plus + Manual Routes + Pinia + i18n + ESLint + Husky
2. **文件系统路由**：Element Plus + Page Routes + Pinia + i18n
3. **微前端**：Element Plus + qiankun + Manual Routes + Pinia
4. **最小配置**：Ant Design Vue + Manual Routes + Pinia（无 i18n、ESLint、Husky）

### React 项目测试场景（TODO）

目前 React 模板还在优化中，相关测试已跳过。

## 依赖验证规则

### Catalog 引用检查
生成的项目不应该包含任何 `catalog:` 引用，所有依赖版本应该是实际的版本号。

### Monorepo Import 检查
生成的项目代码不应该包含跨模板的 import 引用，例如：
- ❌ `import { xxx } from '../../templates/common/...'`
- ❌ `import { xxx } from '../../../vue/...'`
- ✅ `import { xxx } from '@/utils/...'`
- ✅ `import { xxx } from './local-file'`

### 条件依赖检查
- ESLint 禁用时，不应该有 `@moluoxixi/eslint-config`、`eslint` 依赖
- i18n 禁用时，不应该有 `vue-i18n`、`react-i18next` 依赖
- Husky 禁用时，不应该有 `.husky/` 目录和相关配置文件

## CI/CD 集成

测试会在以下情况自动运行：
1. Push 到 main 分支
2. 创建 Pull Request
3. 手动触发 GitHub Actions

详见 `.github/workflows/publish.yml`

## 调试测试

### 保留测试项目
默认情况下，测试完成后会清理临时项目。如果需要调试，可以注释掉清理代码：

```typescript
afterAll(async () => {
  // 注释掉这行以保留测试项目
  // await cleanupTempDir(projectDir)
})
```

### 查看详细日志
```bash
# 运行测试并显示详细输出
pnpm test -- --reporter=verbose
```

### 调试单个测试
```bash
# 只运行匹配的测试
pnpm test -- -t "should generate all required files"
```

## 常见问题

### Q: E2E 测试超时
A: E2E 测试需要安装依赖和构建，默认超时时间为 180 秒（3 分钟）。如果网络较慢，可以增加超时时间：
```typescript
it('should install dependencies successfully', async () => {
  // ...
}, 300000) // 5 分钟
```

### Q: 集成测试失败
A: 检查以下几点：
1. 模板文件是否完整
2. package.json 依赖是否正确
3. 是否有跨模板引用
4. Catalog 引用是否都已替换

### Q: 单元测试失败
A: 检查代码逻辑是否与测试预期一致，可能需要更新测试用例。

## 贡献指南

添加新测试时，请遵循以下原则：
1. 单元测试专注于单个函数
2. 集成测试覆盖多个模块的交互
3. E2E 测试验证完整的用户场景
4. 使用描述性的测试名称
5. 保持测试独立，不依赖执行顺序
6. 及时清理测试产生的临时文件

