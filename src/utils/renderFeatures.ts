/**
 * Features 渲染工具
 * 统一处理 features 的渲染逻辑
 */

import type { ProjectConfigType } from '../types/index.ts'

import path from 'node:path'

import { getTemplatesDir } from './file.ts'
import { renderTemplate } from './renderTemplate.ts'
import {
  getCommonFeatureMap,
  getConfigToFeatureMap,
  getRouteModeFeature,
  getUILibraryFeature,
} from './featureMapping.ts'

/**
 * 检查 UI 库是否适用于指定框架
 * @param framework 框架类型
 * @param uiLibrary UI 库类型
 * @returns 是否适用
 */
function isUILibrarySupported(framework: string, uiLibrary: string): boolean {
  if (framework === 'vue') {
    return uiLibrary === 'element-plus' || uiLibrary === 'ant-design-vue'
  }
  if (framework === 'react') {
    return uiLibrary === 'ant-design'
  }
  return false
}

/**
 * 渲染 UI 库特性模板
 * @param config 项目配置
 * @param targetDir 目标目录
 * @param templatesDir 模板目录
 * @throws {Error} 如果路径不安全或模板渲染失败
 */
function renderUILibraryFeature(
  config: ProjectConfigType,
  targetDir: string,
  templatesDir: string,
): void {
  const { framework, uiLibrary } = config
  if (isUILibrarySupported(framework, uiLibrary)) {
    const uiLibraryFeature = getUILibraryFeature(uiLibrary)
    renderTemplate(path.join(templatesDir, framework, 'features', uiLibraryFeature), targetDir)
  }
}

/**
 * 渲染框架特定的 features
 * @param config 项目配置
 * @param targetDir 目标目录
 * @throws {Error} 如果路径不安全或模板渲染失败
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

  // UI 库
  renderUILibraryFeature(config, targetDir, templatesDir)
}

/**
 * 渲染公共 features
 * @param config 项目配置
 * @param targetDir 目标目录
 * @throws {Error} 如果路径不安全或模板渲染失败
 */
export function renderCommonFeatures(config: ProjectConfigType, targetDir: string): void {
  const templatesDir = getTemplatesDir()
  const commonFeatureMap = getCommonFeatureMap()

  for (const [configKey, featureName] of Object.entries(commonFeatureMap)) {
    if (config[configKey as keyof ProjectConfigType] === true) {
      const featurePath = path.join(templatesDir, 'common', 'features', featureName!)
      renderTemplate(featurePath, targetDir)
    }
  }
}
