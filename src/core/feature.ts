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
export function getCommonFeatures(): string[] {
  const templatesDir = getTemplatesDir()
  const commonFeaturesDir = path.join(templatesDir, 'common', 'features')
  return scanFeatures(commonFeaturesDir)
}

/**
 * 获取框架 features 列表（从文件系统扫描）
 * @param framework 框架类型
 * @returns 框架 feature 名称数组
 */
export function getFrameworkFeatures(framework: FrameworkType): string[] {
  const templatesDir = getTemplatesDir()
  const frameworkFeaturesDir = path.join(templatesDir, framework, 'features')
  return scanFeatures(frameworkFeaturesDir)
}

/**
 * 获取微前端引擎列表（从文件系统扫描）
 * @param framework 框架类型
 * @returns 微前端引擎名称数组
 */
export function getMicroFrontendEngines(framework: FrameworkType): string[] {
  const templatesDir = getTemplatesDir()
  const microFrontendsDir = path.join(templatesDir, framework, 'micro-frontends')
  return scanFeatures(microFrontendsDir)
}

// ============================================================================
// Feature 映射（用于测试用例生成）
// ============================================================================

/**
 * 扫描所有 features（框架的 + 公共的 + 微前端的）
 * @param framework 框架类型
 * @returns 所有 feature 名称数组
 */
export function scanAllFeatures(framework: FrameworkType): string[] {
  const templatesDir = getTemplatesDir()
  const frameworkDir = path.join(templatesDir, framework, 'features')
  const commonDir = path.join(templatesDir, 'common', 'features')

  const features: string[] = []

  // 扫描框架 features
  if (fs.existsSync(frameworkDir)) {
    features.push(...scanFeatures(frameworkDir))
  }

  // 扫描公共 features
  if (fs.existsSync(commonDir)) {
    features.push(...scanFeatures(commonDir))
  }

  // 扫描微前端 features
  const microFrontendsDir = path.join(templatesDir, framework, 'micro-frontends')
  if (fs.existsSync(microFrontendsDir)) {
    const engines = getMicroFrontendEngines(framework)
    for (const engine of engines) {
      const microFrontendFeaturesPath = path.join(
        microFrontendsDir,
        engine,
        'features',
      )
      if (fs.existsSync(microFrontendFeaturesPath)) {
        features.push(...scanFeatures(microFrontendFeaturesPath))
      }
    }
  }

  // 去重并返回
  return [...new Set(features)]
}

/**
 * 过滤出布尔类型功能（排除 UI 库和路由模式）
 * @param features feature 名称数组
 * @returns 布尔类型 feature 名称数组
 */
export function filterBooleanFeatures(features: string[]): string[] {
  const allUiLibraries = Object.values(UI_LIBRARIES).flat()
  return features.filter(
    feature => !allUiLibraries.includes(feature as UILibraryType)
      && !ROUTE_MODES.includes(feature as RouteModeType),
  )
}

/**
 * Feature 名称转换为配置键和值（用于测试用例生成）
 * 注意：大部分情况下 feature 名称 === 配置名称
 * @param feature feature 名称
 * @param _framework 框架类型（保留参数以保持接口兼容性）
 * @returns 配置键值对
 */
export function featureToConfig(
  feature: string,
  _framework: FrameworkType,
): { key: string, value: string | boolean } {
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

  // 其他所有情况都视为布尔类型的 features：配置名 === feature 名
  // 除了 UI 库、路由模式之外，其他都是布尔类型
  return { key: feature, value: true }
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
  // 使用常量确保类型安全，避免硬编码字符串
  // 遍历 ROUTE_MODES 数组，初始化所有路由模式为 false
  const result: Record<RouteModeType, boolean> = {} as Record<RouteModeType, boolean>

  for (const mode of ROUTE_MODES) {
    result[mode] = mode === routeMode
  }

  return result as { manualRoutes: boolean, pageRoutes: boolean }
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
