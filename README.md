# Vite Template CLI

基于 Vite 的脚手架项目模板，支持 Vue 3 和 React 两种框架。

## 功能特性

- ✅ 支持 Vue 3 + TypeScript
- ✅ 支持 React + TypeScript
- ✅ 支持文件系统路由（vite-plugin-pages）和手动路由
- ✅ 支持 Element Plus / Ant Design Vue / Ant Design
- ✅ 使用 `@moluoxixi/ajax-package` 进行 HTTP 请求
- ✅ 使用 `@moluoxixi/class-names` 处理类名
- ✅ 使用 dayjs 处理时间
- ✅ 支持国际化（i18n）
- ✅ 支持微前端（qiankun）
- ✅ 支持错误监控（Sentry）
- ✅ 完整的代码规范和 Git 提交规范

## 安装

```bash
pnpm install
```

## 开发

```bash
# 开发模式运行
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check
```

## 使用

```bash
# 创建新项目
pnpm dev create <project-name>

# 或直接运行
node dist/index.js create <project-name>
```

## 项目结构

```
vite-cli/
├── src/                    # 源代码
│   ├── commands/          # 命令处理
│   ├── generators/         # 项目生成器
│   ├── utils/             # 工具函数
│   └── types/             # 类型定义
├── templates/             # 模板文件
│   ├── vue/               # Vue 模板
│   ├── react/             # React 模板
│   └── common/            # 通用模板
└── dist/                  # 编译输出
```

## 开发规范

遵循团队前端编程规范：

- 使用 2 个空格缩进
- 使用单引号
- 使用分号
- 变量使用 camelCase
- 类名使用 PascalCase
- 常量使用 SCREAMING_SNAKE_CASE
- 文件/文件夹使用 kebab-case

