/**
 * CLI 类型定义
 */

/**
 * 框架类型
 */
export type Framework = 'vue' | 'react'

/**
 * UI 库类型
 */
export type UILibrary = 'element-plus' | 'ant-design-vue' | 'ant-design'

/**
 * 路由模式类型
 */
export type RouteMode = 'file-system' | 'manual'

/**
 * 包管理器类型
 */
export type PackageManager = 'pnpm' | 'npm' | 'yarn'

/**
 * 项目配置
 */
export interface ProjectConfig {
  /** 项目名称 */
  projectName: string
  /** 项目描述 */
  description: string
  /** 作者 */
  author: string
  /** 框架类型 */
  framework: Framework
  /** UI 库 */
  uiLibrary: UILibrary
  /** 路由模式 */
  routeMode: RouteMode
  /** 是否启用国际化 */
  i18n: boolean
  /** 是否启用微前端支持 */
  qiankun: boolean
  /** 是否启用错误监控 */
  sentry: boolean
  /** 包管理器 */
  packageManager: PackageManager
  /** 目标目录 */
  targetDir: string
}

