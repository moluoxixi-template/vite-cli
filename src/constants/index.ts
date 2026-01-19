/**
 * 项目常量定义
 * 统一管理所有硬编码的字符串和配置值
 */

import type {
  FrameworkType,
  MicroFrontendEngine,
  PackageManagerType,
  RouteModeType,
  UILibraryType,
} from '../types/index.ts'

/**
 * 文件系统相关常量
 */
export const FILE_CONSTANTS = {
  /** node_modules 目录名 */
  NODE_MODULES: 'node_modules',
  /** package.json 文件名 */
  PACKAGE_JSON: 'package.json',
  /** .ejs 文件扩展名 */
  EJS_EXTENSION: '.ejs',
  /** pnpm-workspace.yaml 文件名 */
  PNPM_WORKSPACE_YAML: 'pnpm-workspace.yaml',
} as const

/**
 * UI 库选项配置（按框架分组，允许部分框架不存在）
 */
export const UI_LIBRARY_OPTIONS: Partial<Record<FrameworkType, Array<{ name: string, value: UILibraryType }>>> = {
  vue: [
    { name: 'Element Plus', value: 'element-plus' as UILibraryType },
    // TODO: 模板还没优化完毕，先不提供
    // { name: 'Ant Design Vue', value: 'ant-design-vue' as UILibraryType },
  ],
  // TODO: 模板还没优化完毕，先不提供
  // react: [
  //   { name: 'Ant Design', value: 'ant-design' as UILibraryType },
  // ],
} as const

/**
 * 框架列表（从 UI_LIBRARY_OPTIONS 的 keys 获取）
 */
export const FRAMEWORKS: readonly FrameworkType[] = Object.keys(UI_LIBRARY_OPTIONS) as FrameworkType[]

/**
 * 框架选项配置（基于 FRAMEWORKS 生成）
 */
export const FRAMEWORK_OPTIONS = FRAMEWORKS.map((framework) => {
  const names: Record<FrameworkType, string> = {
    vue: 'Vue 3',
    react: 'React',
  }
  return { name: names[framework], value: framework }
}) as Array<{ name: string, value: FrameworkType }>

/**
 * UI 库列表（按框架分组，仅值）
 * 确保所有框架都有对应的数组（缺失的框架使用空数组）
 */
export const UI_LIBRARIES: Record<FrameworkType, readonly UILibraryType[]> = {
  vue: (UI_LIBRARY_OPTIONS.vue ?? []).map(opt => opt.value),
  react: (UI_LIBRARY_OPTIONS.react ?? []).map(opt => opt.value),
} as const

/**
 * 路由模式选项配置
 */
export const ROUTE_MODE_OPTIONS = [
  { name: '文件系统路由 (vite-plugin-pages)', value: 'pageRoutes' as RouteModeType },
  { name: '手动配置路由', value: 'manualRoutes' as RouteModeType },
] as const

/**
 * 路由模式列表（仅值）
 */
export const ROUTE_MODES: readonly RouteModeType[] = ROUTE_MODE_OPTIONS.map(opt => opt.value)

/**
 * 微前端引擎选项配置
 */
export const MICRO_FRONTEND_ENGINE_OPTIONS = [
  { name: 'qiankun (阿里开源)', value: 'qiankun' as MicroFrontendEngine },
  // TODO: 还没有,后续可考虑接入
  // { name: 'micro-app (京东开源)', value: 'micro-app' as MicroFrontendEngine },
] as const

/**
 * 微前端引擎列表（仅值）
 */
export const MICRO_FRONTEND_ENGINES: readonly MicroFrontendEngine[] = MICRO_FRONTEND_ENGINE_OPTIONS.map(opt => opt.value)

/**
 * 包管理器选项配置
 */
export const PACKAGE_MANAGER_OPTIONS = [
  { name: 'pnpm (推荐)', value: 'pnpm' as PackageManagerType },
  { name: 'npm', value: 'npm' as PackageManagerType },
  { name: 'yarn', value: 'yarn' as PackageManagerType },
] as const

/**
 * 包管理器列表（仅值）
 */
export const PACKAGE_MANAGERS: readonly PackageManagerType[] = PACKAGE_MANAGER_OPTIONS.map(opt => opt.value)

/**
 * 状态管理库映射（按框架自动选择）
 * 框架 -> 对应的状态管理库 feature 名称
 */
export const STATE_MANAGEMENT_MAP: Record<FrameworkType, string> = {
  vue: 'pinia',
  react: 'zustand',
} as const
