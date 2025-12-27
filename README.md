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
- 🌍 **国际化** - 内置 vue-i18n / i18next 支持
- 📊 **错误监控** - 可选 Sentry 集成
- 🔗 **微前端** - 可选 Qiankun 支持 (Vue)
- ⚡ **文件系统路由** - 可选 vite-plugin-pages
- 📝 **TypeScript** - 全面的类型支持
- 🔧 **规范配置** - ESLint + Commitlint + Husky

## 内置依赖

所有生成的项目都包含以下核心依赖：

| 依赖包 | 用途 |
|--------|------|
| `@moluoxixi/eslint-config` | ESLint 统一配置 |
| `@moluoxixi/vite-config` | Vite 构建配置 |
| `@moluoxixi/ajax-package` | HTTP 请求封装 |
| `@moluoxixi/class-names` | CSS 类名工具 |
| `@moluoxixi/css-module-global-root-plugin` | CSS Module 插件 |

## 项目结构

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
├── pnpm-workspace.yaml  # pnpm 工作区
├── vite.config.ts       # Vite 配置
├── eslint.config.ts     # ESLint 配置
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

| 选项 | 类型 | 说明 |
|------|------|------|
| 项目名称 | string | 项目名称，用于 package.json |
| 框架 | vue / react | 前端框架 |
| UI 库 | element-plus / ant-design-vue / ant-design | UI 组件库 |
| 路由模式 | manual / file-system | 手动配置或文件系统路由 |
| 国际化 | boolean | 是否启用多语言支持 |
| 错误监控 | boolean | 是否集成 Sentry |
| 微前端 | boolean | 是否支持 Qiankun (仅 Vue) |
| 包管理器 | pnpm / npm / yarn | 包管理器 |

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

## 架构文档

详细的架构说明请参阅 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 许可证

MIT
