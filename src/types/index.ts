/**
 * CLI 类型定义
 * 定义项目配置、模板层级等核心类型
 */

export * from './ejs'
export * from './features'
export * from './viteConfig'

/**
 * 框架类型
 */
export type FrameworkType = 'vue' | 'react'

/**
 * UI 库类型
 */
export type UILibraryType = 'element-plus' | 'ant-design-vue' | 'ant-design'

/**
 * 路由模式类型
 */
export type RouteModeType = 'file-system' | 'manual'

/**
 * 包管理器类型
 */
export type PackageManagerType = 'pnpm' | 'npm' | 'yarn'

/**
 * 项目配置接口
 */
export interface ProjectConfigType {
  /** 项目名称 */
  projectName: string
  /** 项目描述 */
  description: string
  /** 作者 */
  author: string
  /** 框架类型 */
  framework: FrameworkType
  /** UI 库 */
  uiLibrary: UILibraryType
  /** 路由模式 */
  routeMode: RouteModeType
  /** 是否启用路由 */
  router: boolean
  /** 是否启用状态管理 (Vue: pinia, React: zustand) */
  stateManagement: boolean
  /** 是否启用国际化 */
  i18n: boolean
  /** 是否启用微前端支持 */
  qiankun: boolean
  /** 是否启用错误监控 */
  sentry: boolean
  /** 是否启用 ESLint */
  eslint: boolean
  /** 是否启用 Git Hooks (husky + commitlint + lint-staged) */
  gitHooks: boolean
  /** 包管理器 */
  packageManager: PackageManagerType
  /** 目标目录 */
  targetDir: string
}
