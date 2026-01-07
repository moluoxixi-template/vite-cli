# @moluoxixi/create-app

> 基于原子化分层叠加架构的项目脚手架 CLI

## 快速开始

```bash
# 使用 npx
npx @moluoxixi/create-app

# 使用 pnpm
pnpm create @moluoxixi/app

# 使用 npm
npm create @moluoxixi/app
```

## 特性

- 🚀 **原子化分层架构** - L0/L1/L2 三层模板，灵活组合
- 📦 **多框架支持** - Vue 3、React 18
- 🎨 **多 UI 库** - Element Plus、Ant Design Vue、Ant Design
- 📝 **TypeScript** - 全面的类型支持
- 🛣️ **路由系统** - Vue Router / React Router DOM，支持手动配置和文件系统路由
- 🗄️ **状态管理** - Pinia (Vue) / Zustand (React)，根据框架自动启用
- 🌍 **国际化** - 可选 vue-i18n / i18next 支持
- 📊 **错误监控** - 可选 Sentry 集成
- 🔧 **规范配置** - 可选 ESLint + Commitlint + Husky
- 🧩 **微前端支持** - 可选 Qiankun 集成

## 📋 开发计划

以下功能正在规划中，欢迎贡献：

- [ ] 🔄 **Ant Design Vue 模板重构** - 优化 ant-design-vue 模板结构和配置
- [ ] 🔄 **Ant Design 模板重构** - 优化 ant-design 模板结构和配置
- [ ] 🔧 **main.ts.ejs 解耦** - 将 Vue 入口文件模板解耦，提高可维护性
- [ ] 🔧 **main.tsx.ejs 解耦** - 将 React 入口文件模板解耦，提高可维护性
- [ ] 🔧 **vite.config.ts.ejs 解耦** - 将 Vite 配置模板解耦，提高可维护性

## 内置依赖

所有生成的项目都包含以下核心依赖：

| 依赖包 | 用途 |
|--------|------|
| `@moluoxixi/eslint-config` | ESLint 统一配置 |
| `@moluoxixi/vite-config` | Vite 构建配置 |
| `@moluoxixi/ajax-package` | HTTP 请求封装 |
| `@moluoxixi/class-names` | CSS 类名工具 |
| `@moluoxixi/css-module-global-root-plugin` | CSS Module 插件 |

## 源码目录结构

本项目采用清晰的模块化架构，将业务逻辑和工具函数分离：

```
src/
├── commands/              # CLI 命令
│   ├── index.ts          # 命令导出
│   └── create.ts         # create 命令实现
│
├── constants/             # 常量定义
│   └── index.ts          # 文件常量、路径常量等
│
├── core/                 # 核心业务逻辑模块
│   ├── index.ts          # 核心模块导出
│   ├── feature.ts        # Feature 管理（扫描、映射、渲染）
│   ├── prompts.ts        # 交互式问答（收集用户配置）
│   └── template.ts       # 模板渲染（文件复制、合并）
│
├── generators/            # 项目生成器
│   ├── index.ts          # 生成器导出
│   └── project.ts       # 项目生成核心逻辑
│
├── types/                 # TypeScript 类型定义
│   ├── index.ts          # 公共类型导出
│   ├── features.ts       # Feature 相关类型
│   └── packageJson.ts    # package.json 类型
│
├── utils/                 # 纯工具函数（无业务逻辑）
│   ├── index.ts          # 工具函数导出
│   ├── deepMerge.ts      # 深度合并对象
│   ├── file.ts           # 文件操作（读写、复制、路径处理）
│   ├── install.ts        # 依赖安装、Git 初始化
│   ├── npmConfig.ts      # npm 配置读取
│   └── sortDependencies.ts # 依赖排序
│
├── index.ts              # CLI 入口
└── test.ts               # 测试脚本
```

### 目录职责说明

- **`commands/`** - CLI 命令实现，处理用户交互和流程控制
- **`core/`** - 核心业务逻辑，包含 feature 管理、模板渲染、用户配置收集
- **`generators/`** - 项目生成器，根据配置生成完整的项目结构
- **`utils/`** - 纯工具函数，不包含业务逻辑，可独立使用
- **`types/`** - TypeScript 类型定义，确保类型安全
- **`constants/`** - 常量定义，集中管理配置值

### 设计原则

1. **职责分离** - 业务逻辑在 `core/`，工具函数在 `utils/`
2. **模块化** - 每个模块职责单一，便于维护和测试
3. **类型安全** - 完整的 TypeScript 类型定义
4. **可扩展性** - 通过文件系统扫描自动发现 features，无需手动配置

## 生成的项目结构

生成的项目结构示例：

```
my-project/
├── .husky/              # Git Hooks
├── scripts/             # 构建脚本
├── src/
│   ├── apis/            # API 请求层
│   ├── assets/          # 静态资源
│   ├── components/      # 公共组件
│   ├── constants/       # 常量定义
│   ├── directives/      # Vue 指令
│   ├── layouts/         # 布局组件
│   ├── locales/         # 多语言文件
│   ├── pages/           # 页面组件
│   ├── router/          # 路由配置
│   ├── stores/          # 状态管理
│   ├── utils/           # 工具函数
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── .env                 # 环境变量
├── package.json         # 项目配置
├── vite.config.ts       # Vite 配置
├── eslint.config.ts     # ESLint 配置（可选）
└── tsconfig.json        # TypeScript 配置
```

## 命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 构建并打包
pnpm build:zip

# 类型检查
pnpm type-check

# 代码检查
pnpm lint:eslint

# 提交代码
pnpm commit
```

## 配置选项

### 必选配置

| 选项 | 类型 | 说明 |
|------|------|------|
| 项目名称 | string | 项目名称，用于 package.json |
| 框架 | vue / react | 前端框架 |
| UI 库 | element-plus / ant-design-vue / ant-design | UI 组件库 |
| 路由模式 | manualRoutes / pageRoutes | 手动配置或文件系统路由 |
| 包管理器 | pnpm / npm / yarn | 包管理器 |

### 可选功能

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| 国际化 | boolean | true | 是否启用多语言支持 (vue-i18n / i18next) |
| 错误监控 | boolean | false | 是否集成 Sentry |
| ESLint | boolean | true | 是否启用 ESLint 代码规范检查 |
| Git Hooks | boolean | true | 是否启用 Husky + Commitlint |


## 开发

```bash
# 克隆仓库
git clone https://github.com/moluoxixi/create-app.git

# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建
pnpm build
```

## 许可证

MIT
