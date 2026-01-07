/**
 * CLI type definitions
 * Define project configuration, template layers and other core types
 */

import type { MicroFrontendEngine } from './features.ts'

export * from './features.ts'

/**
 * Framework type
 */
export type FrameworkType = 'vue' | 'react'

/**
 * UI library type
 */
export type UILibraryType = 'element-plus' | 'ant-design-vue' | 'ant-design'

/**
 * Route mode type
 */
export type RouteModeType = 'manualRoutes' | 'pageRoutes'

/**
 * Package manager type
 */
export type PackageManagerType = 'pnpm' | 'npm' | 'yarn'

/**
 * Project configuration interface
 */
export interface ProjectConfigType {
  /** Project name */
  projectName: string
  /** Project description */
  description: string
  /** Author */
  author: string
  /** Framework type */
  framework: FrameworkType
  /** UI library (feature name: element-plus | ant-design-vue | ant-design) */
  uiLibrary: UILibraryType
  /** Route mode (determines manualRoutes or pageRoutes feature) */
  routeMode: RouteModeType
  /** Enable pinia feature (Vue) */
  pinia?: boolean
  /** Enable zustand feature (React) */
  zustand?: boolean
  /** Enable manualRoutes feature */
  manualRoutes?: boolean
  /** Enable pageRoutes feature */
  pageRoutes?: boolean
  /** Enable i18n feature */
  i18n: boolean
  /** Enable micro-frontend support */
  microFrontend: boolean
  /** Micro-frontend engine (qiankun, micro-app, etc.) - valid when microFrontend is true */
  microFrontendEngine?: MicroFrontendEngine
  /** Enable sentry feature */
  sentry: boolean
  /** Enable eslint feature */
  eslint: boolean
  /** Enable husky feature (Git Hooks) */
  husky: boolean
  /** Package manager */
  packageManager: PackageManagerType
  /** Target directory */
  targetDir: string
}
