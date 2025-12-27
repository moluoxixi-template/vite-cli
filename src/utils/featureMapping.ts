/**
 * Features 映射工具
 * 统一管理配置项到 feature 目录的映射关系
 */

import type { FrameworkType } from '../types'
import fs from 'fs-extra'
import path from 'node:path'
import { getTemplatesDir } from './file'

/**
 * 扫描所有 features（框架的 + 公共的）
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

  return features
}

/**
 * 配置项到 feature 目录的映射（从 renderFeatures 提取）
 */
export function getConfigToFeatureMap(framework: FrameworkType): Record<string, string> {
  return {
    router: 'router',
    stateManagement: framework === 'vue' ? 'pinia' : 'zustand',
    eslint: 'eslint',
    i18n: 'i18n',
    sentry: 'sentry',
    qiankun: 'qiankun',
  }
}

/**
 * 公共 features 映射
 */
export function getCommonFeatureMap(): Record<string, string> {
  return {
    gitHooks: 'husky',
  }
}

/**
 * 路由模式映射
 */
export function getRouteModeFeature(routeMode: string): string {
  return routeMode === 'manual' ? 'manualRoutes' : 'pageRoutes'
}

/**
 * UI 库映射
 */
export function getUILibraryFeature(uiLibrary: string): string {
  return uiLibrary
}

/**
 * Feature 名称转换为配置键和值（用于测试用例生成）
 */
export function featureToConfig(feature: string, framework: FrameworkType): { key: string, value: any } | null {
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
