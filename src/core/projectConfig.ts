/**
 * 项目配置边界。
 * 所有程序化调用和交互配置都必须在写入目标目录前经过这里。
 */

import type { FrameworkType, ProjectConfigType } from '../types/index.ts'
import type { StateManagementFeature } from './capabilities.ts'

import {
  FRAMEWORK_CAPABILITIES,
  FRAMEWORK_ORDER,
  MICRO_FRONTEND_ENGINE_CAPABILITIES,
  PACKAGE_MANAGER_CAPABILITIES,
  ROUTE_MODE_CAPABILITIES,
} from './capabilities.ts'

const ERROR_PREFIX = '能力配置无效'

function invalidCapability(message: string): never {
  throw new Error(`${ERROR_PREFIX}: ${message}`)
}

function assertSupportedFramework(framework: FrameworkType) {
  const isKnown = FRAMEWORK_ORDER.includes(framework)
  if (!isKnown || !FRAMEWORK_CAPABILITIES[framework]?.enabled) {
    invalidCapability(`不支持的框架 "${framework}"`)
  }

  return FRAMEWORK_CAPABILITIES[framework]
}

/**
 * 将冗余 feature 标志收敛为 routeMode/framework 的确定投影，并验证组合约束。
 */
export function normalizeProjectConfig(config: ProjectConfigType): ProjectConfigType {
  const frameworkCapability = assertSupportedFramework(config.framework)
  const uiCapability = frameworkCapability.uiLibraries.find(item => item.value === config.uiLibrary)
  if (!uiCapability?.enabled) {
    invalidCapability(`uiLibrary "${config.uiLibrary}" 不适用于 framework "${config.framework}"`)
  }

  const routeCapability = ROUTE_MODE_CAPABILITIES.find(item => item.value === config.routeMode)
  const supportedRouteModes: readonly string[] = frameworkCapability.routeModes
  if (!routeCapability?.enabled || !supportedRouteModes.includes(config.routeMode)) {
    invalidCapability(`routeMode "${config.routeMode}" 不适用于 framework "${config.framework}"`)
  }

  const packageManagerCapability = PACKAGE_MANAGER_CAPABILITIES.find(item => item.value === config.packageManager)
  if (!packageManagerCapability?.enabled) {
    invalidCapability(`不支持的 packageManager "${config.packageManager}"`)
  }

  const routeFlags = {
    manualRoutes: config.routeMode === 'manualRoutes',
    pageRoutes: config.routeMode === 'pageRoutes',
  }
  for (const routeMode of ['manualRoutes', 'pageRoutes'] as const) {
    const configured = config[routeMode]
    if (configured !== undefined && configured !== routeFlags[routeMode]) {
      invalidCapability(`${routeMode} 与 routeMode "${config.routeMode}" 冲突`)
    }
  }

  const stateFlags: Record<StateManagementFeature, boolean> = {
    pinia: false,
    zustand: false,
  }
  stateFlags[frameworkCapability.stateManagement] = true
  for (const stateFeature of ['pinia', 'zustand'] as const) {
    const configured = config[stateFeature]
    if (configured !== undefined && configured !== stateFlags[stateFeature]) {
      invalidCapability(`${stateFeature} 与 framework "${config.framework}" 冲突`)
    }
  }

  if (config.microFrontend) {
    if (!config.microFrontendEngine) {
      invalidCapability('microFrontend 为 true 时必须提供 microFrontendEngine')
    }

    const engineCapability = MICRO_FRONTEND_ENGINE_CAPABILITIES.find(
      item => item.value === config.microFrontendEngine,
    )
    const supportedEngines: readonly string[] = frameworkCapability.microFrontendEngines
    if (!engineCapability?.enabled || !supportedEngines.includes(config.microFrontendEngine)) {
      invalidCapability(
        `microFrontendEngine "${config.microFrontendEngine}" 不适用于 framework "${config.framework}"`,
      )
    }
  }
  else if (config.microFrontendEngine !== undefined) {
    invalidCapability('microFrontend 为 false 时不能提供 microFrontendEngine')
  }

  return {
    ...config,
    ...routeFlags,
    ...stateFlags,
    microFrontendEngine: config.microFrontend ? config.microFrontendEngine : undefined,
  }
}
