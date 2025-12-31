/**
 * Features 映射工具
 * 统一管理配置项到 feature 目录的映射关系
 */

import type { FrameworkType } from '../types/index.ts'
import fs from 'fs-extra'
import path from 'node:path'
import { getTemplatesDir } from './file.ts'

/**
 * UI 库优先级顺序（用于排序，确保默认选择）
 */
const UI_LIBRARY_PRIORITY: Record<string, number> = {
  'element-plus': 1,
  'ant-design-vue': 2,
  'ant-design': 1,
}

/**
 * 扫描所有 features（框架的 + 公共的）
 * @param framework 框架类型
 * @returns 所有 feature 名称数组（UI 库按优先级排序）
 */
export function scanAllFeatures(framework: FrameworkType): string[] {
  const frameworkDir = path.join(getTemplatesDir(), framework, 'features')
  const commonDir = path.join(getTemplatesDir(), 'common', 'features')

  const features: string[] = []

  if (fs.existsSync(frameworkDir)) {
    features.push(...fs.readdirSync(frameworkDir).filter(f =>
      fs.statSync(path.join(frameworkDir, f)).isDirectory(),
    ))
  }

  if (fs.existsSync(commonDir)) {
    features.push(...fs.readdirSync(commonDir).filter(f =>
      fs.statSync(path.join(commonDir, f)).isDirectory(),
    ))
  }

  // 对 UI 库进行排序，确保 element-plus 优先（优先级数字越小越靠前）
  return features.sort((a, b) => {
    const priorityA = UI_LIBRARY_PRIORITY[a] ?? 999
    const priorityB = UI_LIBRARY_PRIORITY[b] ?? 999
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    // 相同优先级时保持字母顺序
    return a.localeCompare(b)
  })
}

/**
 * 配置项到 feature 目录的映射（从 renderFeatures 提取）
 * @param framework 框架类型
 * @returns 配置键到 feature 名称的映射对象
 */
export function getConfigToFeatureMap(framework: FrameworkType): Record<string, string> {
  return {
    router: 'router',
    stateManagement: framework === 'vue' ? 'pinia' : 'zustand',
    eslint: 'eslint',
    i18n: 'i18n',
    sentry: 'sentry',
    // qiankun 已内置到 base，不再作为 feature
  }
}

/**
 * 公共 features 映射
 * @returns 公共配置键到 feature 名称的映射对象
 */
export function getCommonFeatureMap(): Record<string, string> {
  return {
    gitHooks: 'husky',
  }
}

/**
 * 路由模式映射
 * @param routeMode 路由模式（'manual' 或 'file-system'）
 * @returns feature 名称
 */
export function getRouteModeFeature(routeMode: string): string {
  return routeMode === 'manual' ? 'manualRoutes' : 'pageRoutes'
}

/**
 * UI 库映射
 * @param uiLibrary UI 库名称
 * @returns feature 名称（通常与 UI 库名称相同）
 */
export function getUILibraryFeature(uiLibrary: string): string {
  return uiLibrary
}

/**
 * Feature 名称转换为配置键和值（用于测试用例生成）
 * @param feature feature 名称
 * @param framework 框架类型
 * @returns 配置键值对，如果无法映射则返回 null
 */
export function featureToConfig(
  feature: string,
  framework: FrameworkType,
): { key: string, value: string | boolean } | null {
  // 路由模式
  if (feature === 'manualRoutes')
    return { key: 'routeMode', value: 'manual' }
  if (feature === 'pageRoutes')
    return { key: 'routeMode', value: 'file-system' }

  // UI 库
  const uiLibraries = ['element-plus', 'ant-design-vue', 'ant-design']
  if (uiLibraries.includes(feature))
    return { key: 'uiLibrary', value: feature }

  // 状态管理（反向映射）
  const stateManagementMap: Record<string, string> = {
    pinia: 'stateManagement',
    zustand: 'stateManagement',
  }
  if (stateManagementMap[feature])
    return { key: stateManagementMap[feature], value: true }

  // Git Hooks（公共 feature）
  if (feature === 'husky')
    return { key: 'gitHooks', value: true }

  // 其他布尔 features（通过映射查找）
  const configMap = getConfigToFeatureMap(framework)
  const configKey = Object.keys(configMap).find(key => configMap[key] === feature)
  if (configKey)
    return { key: configKey, value: true }

  // 公共 features
  const commonMap = getCommonFeatureMap()
  const commonKey = Object.keys(commonMap).find(key => commonMap[key] === feature)
  if (commonKey)
    return { key: commonKey, value: true }

  return null
}
