/**
 * CLI 类型定义
 * 定义项目配置、模板层级等核心类型
 */

import type { MicroFrontendEngine } from './features.ts'

export * from './ejs.ts'
export * from './features.ts'

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
export type RouteModeType = 'manualRoutes' | 'pageRoutes'

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
  /** UI 库（feature 名称：element-plus | ant-design-vue | ant-design） */
  uiLibrary: UILibraryType
  /** 路由模式（决定使用 manualRoutes 还是 pageRoutes feature） */
  routeMode: RouteModeType
  /** 是否启用 pinia/zustand feature */
  pinia?: boolean
  /** 是否启用 zustand feature (React) */
  zustand?: boolean
  /** 是否启用 manualRoutes feature */
  manualRoutes?: boolean
  /** 是否启用 pageRoutes feature */
  pageRoutes?: boolean
  /** 是否启用 i18n feature */
  i18n: boolean
  /** 是否启用微前端支持 */
  microFrontend: boolean
  /** 微前端引擎（qiankun、micro-app 等）- 当 microFrontend 为 true 时有效 */
  microFrontendEngine?: MicroFrontendEngine
  /** 是否启用 sentry feature */
  sentry: boolean
  /** 是否启用 eslint feature */
  eslint: boolean
  /** 是否启用 husky feature (Git Hooks) */
  husky: boolean
  /** 包管理器 */
  packageManager: PackageManagerType
  /** 目标目录 */
  targetDir: string
}
