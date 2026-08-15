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
import type { CapabilityOption, StateManagementFeature } from '../core/capabilities.ts'

import {
  FRAMEWORK_CAPABILITIES,
  FRAMEWORK_ORDER,
  MICRO_FRONTEND_ENGINE_CAPABILITIES,
  PACKAGE_MANAGER_CAPABILITIES,
  ROUTE_MODE_CAPABILITIES,
} from '../core/capabilities.ts'

function getEnabledOptions<TValue extends string>(
  options: readonly CapabilityOption<TValue>[],
): Array<{ name: string, value: TValue }> {
  return options
    .filter(option => option.enabled)
    .map(({ name, value }) => ({ name, value }))
}

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

export const UI_LIBRARY_OPTIONS: Record<FrameworkType, Array<{ name: string, value: UILibraryType }>> = {
  vue: getEnabledOptions(FRAMEWORK_CAPABILITIES.vue.uiLibraries),
  react: getEnabledOptions(FRAMEWORK_CAPABILITIES.react.uiLibraries),
}

/**
 * 当前正式开放的框架列表。
 */
export const FRAMEWORKS: readonly FrameworkType[] = FRAMEWORK_ORDER.filter(
  framework => FRAMEWORK_CAPABILITIES[framework].enabled,
)

/**
 * 框架选项配置（基于 FRAMEWORKS 生成）
 */
export const FRAMEWORK_OPTIONS = FRAMEWORKS.map((framework) => {
  return { name: FRAMEWORK_CAPABILITIES[framework].name, value: framework }
}) as Array<{ name: string, value: FrameworkType }>

/**
 * UI 库列表（按框架分组，仅值）
 * 确保所有框架都有对应的数组（缺失的框架使用空数组）
 */
export const UI_LIBRARIES: Record<FrameworkType, readonly UILibraryType[]> = {
  vue: UI_LIBRARY_OPTIONS.vue.map(opt => opt.value),
  react: UI_LIBRARY_OPTIONS.react.map(opt => opt.value),
} as const

/**
 * 路由模式选项配置
 */
export const ROUTE_MODE_OPTIONS: Array<{ name: string, value: RouteModeType }> = getEnabledOptions(
  ROUTE_MODE_CAPABILITIES,
)

/**
 * 路由模式列表（仅值）
 */
export const ROUTE_MODES: readonly RouteModeType[] = ROUTE_MODE_OPTIONS.map(opt => opt.value)

export function getRouteModeOptions(framework: FrameworkType): Array<{ name: string, value: RouteModeType }> {
  const supportedModes: readonly string[] = FRAMEWORK_CAPABILITIES[framework].routeModes
  return ROUTE_MODE_OPTIONS.filter(option => supportedModes.includes(option.value))
}

/**
 * 微前端引擎选项配置
 */
export const MICRO_FRONTEND_ENGINE_OPTIONS: Array<{ name: string, value: MicroFrontendEngine }> = getEnabledOptions(
  MICRO_FRONTEND_ENGINE_CAPABILITIES,
)

/**
 * 微前端引擎列表（仅值）
 */
export const MICRO_FRONTEND_ENGINES: readonly MicroFrontendEngine[] = MICRO_FRONTEND_ENGINE_OPTIONS.map(opt => opt.value)

export function getMicroFrontendEngineOptions(
  framework: FrameworkType,
): Array<{ name: string, value: MicroFrontendEngine }> {
  const supportedEngines: readonly string[] = FRAMEWORK_CAPABILITIES[framework].microFrontendEngines
  return MICRO_FRONTEND_ENGINE_OPTIONS.filter(option => supportedEngines.includes(option.value))
}

/**
 * 包管理器选项配置
 */
export const PACKAGE_MANAGER_OPTIONS: Array<{ name: string, value: PackageManagerType }> = getEnabledOptions(
  PACKAGE_MANAGER_CAPABILITIES,
)

/**
 * 包管理器列表（仅值）
 */
export const PACKAGE_MANAGERS: readonly PackageManagerType[] = PACKAGE_MANAGER_OPTIONS.map(opt => opt.value)

/**
 * 状态管理库映射（按框架自动选择）
 * 框架 -> 对应的状态管理库 feature 名称
 */
export const STATE_MANAGEMENT_MAP: Record<FrameworkType, StateManagementFeature> = {
  vue: FRAMEWORK_CAPABILITIES.vue.stateManagement,
  react: FRAMEWORK_CAPABILITIES.react.stateManagement,
} as const
