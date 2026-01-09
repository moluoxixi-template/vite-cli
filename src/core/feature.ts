/**
 * Feature 核心模块
 * 统一管理 features 的扫描、映射、渲染逻辑
 */

import type { FrameworkType, ProjectConfigType, RouteModeType, UILibraryType } from '../types/index.ts'

import fs from 'fs-extra'
import path from 'node:path'

import { ROUTE_MODES, UI_LIBRARIES } from '../constants/index.ts'
import { getTemplatesDir } from '../utils/file.ts'
import { renderTemplate } from './template.ts'

// ============================================================================
// Feature 扫描
// ============================================================================

/**
 * 扫描指定目录下的所有 feature 目录
 * @param baseDir 基础目录
 * @returns feature 名称数组
 */
function scanFeatures(baseDir: string): string[] {
  if (!fs.existsSync(baseDir)) {
    return []
  }

  return fs.readdirSync(baseDir).filter((item) => {
    const itemPath = path.join(baseDir, item)
    return fs.statSync(itemPath).isDirectory()
  })
}

/**
 * 获取公共 features 列表（从文件系统扫描）
 * @returns 公共 feature 名称数组
 */
function getCommonFeatures(): string[] {
  const templatesDir = getTemplatesDir()
  const commonFeaturesDir = path.join(templatesDir, 'common', 'features')
  return scanFeatures(commonFeaturesDir)
}

/**
 * 获取框架 features 列表（从文件系统扫描）
 * @param framework 框架类型
 * @returns 框架 feature 名称数组
 */
function getFrameworkFeatures(framework: FrameworkType): string[] {
  const templatesDir = getTemplatesDir()
  const frameworkFeaturesDir = path.join(templatesDir, framework, 'features')
  return scanFeatures(frameworkFeaturesDir)
}

/**
 * 获取微前端引擎列表（从文件系统扫描）
 * @param framework 框架类型
 * @returns 微前端引擎名称数组
 */
function getMicroFrontendEngines(framework: FrameworkType): string[] {
  const templatesDir = getTemplatesDir()
  const microFrontendsDir = path.join(templatesDir, framework, 'micro-frontends')
  return scanFeatures(microFrontendsDir)
}

// ============================================================================
// Feature 映射（用于测试用例生成）
// ============================================================================

/**
 * 扫描所有 features（框架的 + 公共的）
 * @param framework 框架类型
 * @returns 所有 feature 名称数组
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
  // 从常量中获取所有 UI 库列表（合并所有框架的 UI 库）
  const allUiLibraries = Object.values(UI_LIBRARIES).flat()
  if (allUiLibraries.includes(feature as UILibraryType)) {
    return { key: 'uiLibrary', value: feature }
  }

  // 路由模式 features：用于测试分类
  if (ROUTE_MODES.includes(feature as RouteModeType)) {
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

// ============================================================================
// 路由模式转换
// ============================================================================

/**
 * 根据路由模式获取对应的布尔特征配置
 * @param routeMode 路由模式（'pageRoutes' | 'manualRoutes'）
 * @returns 包含 manualRoutes 和 pageRoutes 布尔值的对象
 */
export function getRouteModeFeatures(routeMode: RouteModeType): {
  manualRoutes: boolean
  pageRoutes: boolean
} {
  const manualRoutesValue = ROUTE_MODES.find(m => m === 'manualRoutes')!
  const pageRoutesValue = ROUTE_MODES.find(m => m === 'pageRoutes')!
  return {
    manualRoutes: routeMode === manualRoutesValue,
    pageRoutes: routeMode === pageRoutesValue,
  }
}

// ============================================================================
// Feature 渲染
// ============================================================================

/**
 * 渲染框架特定的 features
 * 通过文件系统扫描自动发现并渲染 features
 * @param config 项目配置
 * @param targetDir 目标目录
 * @throws {Error} 如果路径不安全或模板渲染失败
 */
export function renderFrameworkFeatures(config: ProjectConfigType, targetDir: string): void {
  const templatesDir = getTemplatesDir()
  const { framework, uiLibrary } = config

  // 从文件系统扫描获取所有框架 features
  const availableFeatures = getFrameworkFeatures(framework)

  // 遍历配置对象，渲染所有值为 true 且存在于文件系统的 features
  for (const [key, value] of Object.entries(config)) {
    // 如果配置值为 true 且 feature 目录存在，则渲染
    if (value === true && availableFeatures.includes(key)) {
      const featurePath = path.join(templatesDir, framework, 'features', key)
      renderTemplate(featurePath, targetDir)
    }
  }

  // UI 库单独处理（配置值 === feature 目录名）
  if (uiLibrary && availableFeatures.includes(uiLibrary)) {
    renderTemplate(path.join(templatesDir, framework, 'features', uiLibrary), targetDir)
  }
}

/**
 * 渲染公共 features
 * 通过文件系统扫描自动发现并渲染公共 features
 * @param config 项目配置
 * @param targetDir 目标目录
 * @throws {Error} 如果路径不安全或模板渲染失败
 */
export function renderCommonFeatures(config: ProjectConfigType, targetDir: string): void {
  const templatesDir = getTemplatesDir()

  // 从文件系统扫描获取所有公共 features
  const availableFeatures = getCommonFeatures()

  // 遍历配置对象，渲染所有值为 true 且存在于文件系统的公共 features
  for (const [key, value] of Object.entries(config)) {
    if (value === true && availableFeatures.includes(key)) {
      const featurePath = path.join(templatesDir, 'common', 'features', key)
      renderTemplate(featurePath, targetDir)
    }
  }
}

/**
 * 渲染微前端专属的 features（覆盖标准 features）
 * 只渲染文件系统中存在的微前端 features，实现按需覆盖
 * @param config 项目配置
 * @param targetDir 目标目录
 * @param microFrontendEngine 微前端引擎类型
 * @throws {Error} 如果路径不安全或模板渲染失败
 */
export function renderMicroFrontendFeatures(
  config: ProjectConfigType,
  targetDir: string,
  microFrontendEngine: string,
): void {
  const templatesDir = getTemplatesDir()
  const { framework, uiLibrary } = config

  const microFrontendFeaturesPath = path.join(
    templatesDir,
    framework,
    'micro-frontends',
    microFrontendEngine,
    'features',
  )

  // 如果微前端 features 目录不存在，直接返回
  if (!fs.existsSync(microFrontendFeaturesPath)) {
    return
  }

  // 扫描微前端 features 目录
  const availableMicroFrontendFeatures = scanFeatures(microFrontendFeaturesPath)

  // 遍历配置对象，渲染所有值为 true 且存在于微前端 features 的 features
  for (const [key, value] of Object.entries(config)) {
    if (value === true && availableMicroFrontendFeatures.includes(key)) {
      const featurePath = path.join(microFrontendFeaturesPath, key)
      renderTemplate(featurePath, targetDir)
    }
  }

  // UI 库单独处理（如果微前端有 UI 库专属的覆盖）
  if (uiLibrary && availableMicroFrontendFeatures.includes(uiLibrary)) {
    renderTemplate(path.join(microFrontendFeaturesPath, uiLibrary), targetDir)
  }
}

// ============================================================================
// 公共 API（用于测试和文档生成）
// ============================================================================

/**
 * 验证微前端引擎是否存在
 * @param framework 框架类型
 * @param engine 微前端引擎名称
 * @returns 引擎是否存在
 */
export function validateMicroFrontendEngine(framework: FrameworkType, engine: string): boolean {
  const availableEngines = getMicroFrontendEngines(framework)
  return availableEngines.includes(engine)
}

/**
 * 获取可用的公共 features（用于测试和文档生成）
 * @returns 公共 feature 名称数组
 */
export function getAvailableCommonFeatures(): string[] {
  return getCommonFeatures()
}

/**
 * 获取可用的框架 features（用于测试和文档生成）
 * @param framework 框架类型
 * @returns 框架 feature 名称数组
 */
export function getAvailableFrameworkFeatures(framework: FrameworkType): string[] {
  return getFrameworkFeatures(framework)
}

/**
 * 获取可用的微前端引擎（用于测试和文档生成）
 * @param framework 框架类型
 * @returns 微前端引擎名称数组
 */
export function getAvailableMicroFrontendEngines(framework: FrameworkType): string[] {
  return getMicroFrontendEngines(framework)
}
