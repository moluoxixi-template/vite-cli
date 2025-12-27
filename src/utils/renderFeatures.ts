/**
 * Features 渲染工具
 * 统一处理 features 的渲染逻辑
 */

import type { ProjectConfigType } from '../types'

import path from 'node:path'

import { getTemplatesDir } from './file'
import { renderTemplate } from './renderTemplate'
import {
  getCommonFeatureMap,
  getConfigToFeatureMap,
  getRouteModeFeature,
  getUILibraryFeature,
} from './featureMapping'

/**
 * 渲染框架特定的 features
 * @param config 项目配置
 * @param targetDir 目标目录
 */
export function renderFrameworkFeatures(config: ProjectConfigType, targetDir: string): void {
  const templatesDir = getTemplatesDir()
  const framework = config.framework
  const featureMap = getConfigToFeatureMap(framework)

  // 统一处理布尔类型的 features
  for (const [configKey, featureName] of Object.entries(featureMap)) {
    if (config[configKey as keyof ProjectConfigType] === true) {
      const featurePath = path.join(templatesDir, framework, 'features', featureName)
      renderTemplate(featurePath, targetDir)
    }
  }

  // 路由模式
  const routeModeFeature = getRouteModeFeature(config.routeMode)
  renderTemplate(path.join(templatesDir, framework, 'features', routeModeFeature), targetDir)

  // UI 库（保持原有的条件判断，因为不是所有 UI 库都适用于所有框架）
  if (framework === 'vue') {
    if (config.uiLibrary === 'element-plus' || config.uiLibrary === 'ant-design-vue') {
      const uiLibraryFeature = getUILibraryFeature(config.uiLibrary)
      renderTemplate(path.join(templatesDir, framework, 'features', uiLibraryFeature), targetDir)
    }
  }
  else if (framework === 'react') {
    if (config.uiLibrary === 'ant-design') {
      const uiLibraryFeature = getUILibraryFeature(config.uiLibrary)
      renderTemplate(path.join(templatesDir, framework, 'features', uiLibraryFeature), targetDir)
    }
  }
}

/**
 * 渲染公共 features
 * @param config 项目配置
 * @param targetDir 目标目录
 */
export function renderCommonFeatures(config: ProjectConfigType, targetDir: string): void {
  const templatesDir = getTemplatesDir()
  const commonFeatureMap = getCommonFeatureMap()

  for (const [configKey, featureName] of Object.entries(commonFeatureMap)) {
    if (config[configKey as keyof ProjectConfigType] === true) {
      const featurePath = path.join(templatesDir, 'common', 'features', featureName)
      renderTemplate(featurePath, targetDir)
    }
  }
}
