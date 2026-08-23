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
- 📦 **框架支持** - Vue 3 与 React 18
- 🎨 **UI 库** - Vue 使用 Element Plus，React 使用 Ant Design
- 📝 **TypeScript** - 全面的类型支持
- 🛣️ **路由系统** - Vue Router / React Router，支持手动配置和文件系统路由
- 🗄️ **状态管理** - Vue 自动使用 Pinia，React 自动使用 Zustand
- 🌍 **国际化** - 可选 vue-i18n / react-i18next 支持
- 📊 **错误监控** - 可选 Sentry 集成
- 🔧 **规范配置** - 可选 ESLint + Commitlint + Husky
- 🧩 **微前端支持** - 可选 Qiankun 集成

## 📋 开发计划

以下功能正在规划中，欢迎贡献：

- [ ] 🔄 **Ant Design Vue 模板重构** - 优化 ant-design-vue 模板结构和配置
- [ ] 🔄 **micro-app 支持** - 在具备独立入口和生命周期验证后开放
- [x] 🔄 **Ant Design 模板重构** - React Ant Design 模板已开放
- [x] 🔄 **React 生成链路** - standard / qiankun 入口和功能组合已开放
- [x] 🔧 **main.ts.ejs 解耦** - 将 Vue 入口文件模板解耦，提高可维护性
- [x] 🔧 **main.tsx.ejs 解耦** - 将 React 入口文件模板解耦，提高可维护性
- [x] 🔧 **vite.config.ts.ejs 解耦** - 将 Vite 配置模板解耦，提高可维护性

## 内置源码

所有生成的项目都直接包含以下透明源码：

| 源码目录 | 用途 |
|----------|------|
| `src/apis/ajax` | 基于 Axios 的 HTTP 请求封装，可直接阅读和修改 |

生成项目只保留公开的 `axios` 运行时依赖，不再依赖 `@moluoxixi/ajax-package` 黑盒包。

启用 ESLint 时，项目会额外包含 `@moluoxixi/eslint-config`。

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
│   ├── capabilities.ts   # 正式支持能力的单一注册表
│   ├── projectConfig.ts  # 生成前的配置归一化与合法性校验
│   ├── projectAtom.ts    # 按目录叠加顺序合并 atom 贡献
│   ├── projectOutput.ts  # 生成最终 main 与透明 vite.config.ts
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
│   ├── App.vue / App.tsx # 框架对应的根组件
│   └── main.ts / main.tsx # 框架对应的唯一入口文件
├── .env                 # 环境变量
├── package.json         # 项目配置
├── vite.config.ts       # Vite 配置
├── eslint.config.ts     # ESLint 配置（可选）
└── tsconfig.json        # TypeScript 配置
```

模板仍按以下顺序叠加，目录本身就是能力边界：

```text
templates/common/base
  -> templates/<framework>/base
  -> templates/common/features/*
  -> templates/<framework>/features/*
  -> templates/<framework>/micro-frontends/qiankun/base
  -> templates/<framework>/micro-frontends/qiankun/features/*
```

standard 项目不会包含 qiankun import、依赖或生命周期；qiankun 项目仍可独立运行，并在主应用中支持 mount、unmount 和 remount。两种模式最终都只保留普通的 `main.ts` / `main.tsx` 与 `vite.config.ts`，不会把 atom 或内部组合 loader 输出到业务项目。

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
| 框架 | vue / react | 当前正式支持的前端框架 |
| UI 库 | element-plus / ant-design | 按所选框架提供对应 UI 库 |
| 路由模式 | manualRoutes / pageRoutes | 手动配置或文件系统路由 |
| 包管理器 | pnpm / npm / yarn | 包管理器 |

### 可选功能

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| 国际化 | boolean | true | 是否启用 vue-i18n / react-i18next |
| 错误监控 | boolean | false | 是否集成 Sentry |
| ESLint | boolean | true | 是否启用 ESLint 代码规范检查 |
| Git Hooks | boolean | true | 是否启用 Husky + Commitlint |
| 微前端 | boolean | false | 是否启用 qiankun；关闭时保持 standard 入口纯净 |


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

<!-- AIRULES:TRELLIS:START -->

## Trellis 工作流

本项目使用 Trellis 管理 AI 辅助开发流程。在本项目中使用 AI 编程助手时，可以直接发送以下提示词：

```text
请使用 Trellis 开始处理这个需求：<描述需求>
请使用 Trellis 继续当前任务。
请使用 Trellis 检查当前改动。
请使用 Trellis 完成本次工作。
```

AI 编程助手会根据当前宿主选择可用的命令或技能。项目的工作流、任务和规范状态位于 `.trellis/`。

将接口文档、业务说明等文本资料放入 `.trellis/knowledge/sources/`。AI 会在每次对话时检查内容差异，把资料按业务域和稳定实体整理到 `.trellis/knowledge/library/`，并更新 `.trellis/knowledge/index.md`；只有遇到会实质影响整理结果的歧义时才会询问。

<!-- AIRULES:TRELLIS:END -->
