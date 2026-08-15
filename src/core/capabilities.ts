/**
 * 脚手架能力注册表。
 * 类型可以保留历史模板能力，但只有 enabled 的能力会进入交互和生成链路。
 */

import type {
  FrameworkType,
  MicroFrontendEngine,
  PackageManagerType,
  RouteModeType,
  UILibraryType,
} from '../types/index.ts'

export interface CapabilityOption<TValue extends string> {
  name: string
  value: TValue
  enabled: boolean
}

export type StateManagementFeature = 'pinia' | 'zustand'

export interface FrameworkCapability {
  name: string
  enabled: boolean
  uiLibraries: readonly CapabilityOption<UILibraryType>[]
  stateManagement: StateManagementFeature
  routeModes: readonly RouteModeType[]
  microFrontendEngines: readonly MicroFrontendEngine[]
}

export const FRAMEWORK_ORDER = ['vue', 'react'] as const satisfies readonly FrameworkType[]

export const FRAMEWORK_CAPABILITIES = {
  vue: {
    name: 'Vue 3',
    enabled: true,
    uiLibraries: [
      { name: 'Element Plus', value: 'element-plus', enabled: true },
      { name: 'Ant Design Vue', value: 'ant-design-vue', enabled: false },
    ],
    stateManagement: 'pinia',
    routeModes: ['pageRoutes', 'manualRoutes'],
    microFrontendEngines: ['qiankun'],
  },
  react: {
    name: 'React',
    enabled: true,
    uiLibraries: [
      { name: 'Ant Design', value: 'ant-design', enabled: true },
    ],
    stateManagement: 'zustand',
    routeModes: ['pageRoutes', 'manualRoutes'],
    microFrontendEngines: ['qiankun'],
  },
} as const satisfies Record<FrameworkType, FrameworkCapability>

export const ROUTE_MODE_CAPABILITIES = [
  { name: '文件系统路由 (vite-plugin-pages)', value: 'pageRoutes', enabled: true },
  { name: '手动配置路由', value: 'manualRoutes', enabled: true },
] as const satisfies readonly CapabilityOption<RouteModeType>[]

export const MICRO_FRONTEND_ENGINE_CAPABILITIES = [
  { name: 'qiankun (阿里开源)', value: 'qiankun', enabled: true },
  { name: 'micro-app (京东开源)', value: 'micro-app', enabled: false },
] as const satisfies readonly CapabilityOption<MicroFrontendEngine>[]

export const PACKAGE_MANAGER_CAPABILITIES = [
  { name: 'pnpm (推荐)', value: 'pnpm', enabled: true },
  { name: 'npm', value: 'npm', enabled: true },
  { name: 'yarn', value: 'yarn', enabled: true },
] as const satisfies readonly CapabilityOption<PackageManagerType>[]
