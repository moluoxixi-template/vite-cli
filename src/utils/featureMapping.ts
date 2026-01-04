/**
 * Features 映射工具
 * 用于测试用例生成和 feature 扫描
 * 注意：配置名称与 feature 目录名称完全一致，无需额外映射
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
 * Feature 名称转换为配置键和值（用于测试用例生成）
 * 注意：大部分情况下 feature 名称 === 配置名称
 * @param feature feature 名称
 * @param _framework 框架类型（保留参数以保持接口兼容性）
 * @returns 配置键值对，如果无法映射则返回 null
 */
export function featureToConfig(
  feature: string,
  _framework: FrameworkType,
): { key: string, value: string | boolean } | null {
  // UI 库：配置键是 uiLibrary，值是 feature 名称
  const uiLibraries = ['element-plus', 'ant-design-vue', 'ant-design']
  if (uiLibraries.includes(feature)) {
    return { key: 'uiLibrary', value: feature }
  }

  // 路由模式 features：用于测试分类
  if (feature === 'manualRoutes' || feature === 'pageRoutes') {
    return { key: 'routeMode', value: feature }
  }

  // 布尔类型的 features：配置名 === feature 名
  const booleanFeatures = [
    'eslint',
    'i18n',
    'sentry',
    'pinia',
    'zustand',
    'husky',
  ]
  if (booleanFeatures.includes(feature)) {
    return { key: feature, value: true }
  }

  return null
}
