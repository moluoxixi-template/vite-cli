/**
 * 框架项目生成通用工具
 * 抽离 react.ts 和 vue.ts 的公共逻辑
 * 支持三层嵌套优先级（L1: common, L2: framework, L3: micro-frontend）
 */

import type { ProjectConfigType } from '../types/index.ts'

import fs from 'node:fs'
import path from 'node:path'

import { FILE_CONSTANTS } from '../constants/index.ts'
import { renderEjsToFile } from './ejs.ts'
import { getTemplatesDir } from './file.ts'
import { renderCommonFeatures, renderFrameworkFeatures, renderMicroFrontendFeatures } from './renderFeatures.ts'
import { renderTemplate, updatePackageJsonMetadata } from './index.ts'
import { getViteConfigEjsData } from './viteConfigRender.ts'

/**
 * EJS 模板配置接口
 * 定义框架项目生成所需的模板路径配置
 */
interface EjsTemplateConfig {
  /** 主入口文件模板路径（相对于框架 base 目录） */
  mainTemplate: string
  /** 主入口文件输出路径（相对于目标目录） */
  mainOutput: string
}

/**
 * 获取 EJS 模板路径（完整优先级查找）
 * 优先级：微前端 feature > 微前端 base > 框架 feature > 框架 base > common feature > common base
 * @param templatesDir 模板根目录
 * @param framework 框架类型
 * @param config 项目配置（用于获取启用的 features）
 * @param templatePath 模板文件路径（相对于 base 目录）
 * @returns EJS 模板文件路径
 */
function getEjsTemplatePath(
  templatesDir: string,
  framework: string,
  config: ProjectConfigType,
  templatePath: string,
): string {
  const { microFrontend, microFrontendEngine } = config

  // 获取所有启用的 features（包括 UI 库）
  const enabledFeatures: string[] = []
  for (const [key, value] of Object.entries(config)) {
    if (value === true && typeof key === 'string') {
      enabledFeatures.push(key)
    }
  }
  if (config.uiLibrary) {
    enabledFeatures.push(config.uiLibrary)
  }

  // 1. 微前端 feature（按优先级顺序检查每个启用的 feature）
  if (microFrontend && microFrontendEngine) {
    for (const feature of enabledFeatures) {
      const microFrontendFeaturePath = path.join(
        templatesDir,
        framework,
        'micro-frontends',
        microFrontendEngine,
        'features',
        feature,
        templatePath,
      )
      if (fs.existsSync(microFrontendFeaturePath)) {
        return microFrontendFeaturePath
      }
    }
  }

  // 2. 微前端 base
  if (microFrontend && microFrontendEngine) {
    const microFrontendBasePath = path.join(
      templatesDir,
      framework,
      'micro-frontends',
      microFrontendEngine,
      'base',
      templatePath,
    )
    if (fs.existsSync(microFrontendBasePath)) {
      return microFrontendBasePath
    }
  }

  // 3. 框架 feature（按优先级顺序检查每个启用的 feature）
  for (const feature of enabledFeatures) {
    const frameworkFeaturePath = path.join(
      templatesDir,
      framework,
      'features',
      feature,
      templatePath,
    )
    if (fs.existsSync(frameworkFeaturePath)) {
      return frameworkFeaturePath
    }
  }

  // 4. 框架 base
  const frameworkBasePath = path.join(templatesDir, framework, 'base', templatePath)
  if (fs.existsSync(frameworkBasePath)) {
    return frameworkBasePath
  }

  // 5. common feature（按优先级顺序检查每个启用的 feature）
  for (const feature of enabledFeatures) {
    const commonFeaturePath = path.join(
      templatesDir,
      'common',
      'features',
      feature,
      templatePath,
    )
    if (fs.existsSync(commonFeaturePath)) {
      return commonFeaturePath
    }
  }

  // 6. common base（最终回退）
  return path.join(templatesDir, 'common', 'base', templatePath)
}

/**
 * 渲染所有基础模板（base 模板）
 * 按照三层嵌套优先级渲染：L1 (common) -> L2 (framework) -> L3 (micro-frontend)
 * @param templatesDir 模板根目录
 * @param framework 框架类型
 * @param microFrontend 是否启用微前端
 * @param microFrontendEngine 微前端引擎类型
 * @param targetDir 目标目录
 * @throws {Error} 如果模板渲染失败
 */
function renderBaseTemplates(
  templatesDir: string,
  framework: string,
  microFrontend: boolean,
  microFrontendEngine: string | undefined,
  targetDir: string,
): void {
  // 1. 渲染 L1: 公共基础模板（通用层）
  renderTemplate(path.join(templatesDir, 'common', 'base'), targetDir)

  // 2. 渲染 L2: 框架基础模板（框架标准层）
  renderTemplate(path.join(templatesDir, framework, 'base'), targetDir)

  // 3. 渲染 L3: 微前端基础模板（架构增强层）- 按需覆盖
  if (microFrontend && microFrontendEngine) {
    const microFrontendPath = path.join(
      templatesDir,
      framework,
      'micro-frontends',
      microFrontendEngine,
      'base',
    )
    renderTemplate(microFrontendPath, targetDir)
  }
}

/**
 * 渲染所有特性模板（features）
 * 按照三层嵌套优先级渲染：common features -> framework features -> micro-frontend features
 * @param config 项目配置
 * @param targetDir 目标目录
 * @throws {Error} 如果特性渲染失败
 */
function renderAllFeatures(
  config: ProjectConfigType,
  targetDir: string,
): void {
  // 1. 渲染公共特性模板
  renderCommonFeatures(config, targetDir)

  // 2. 渲染框架特性模板
  renderFrameworkFeatures(config, targetDir)

  // 3. 渲染微前端专属的 features（覆盖标准 features）
  if (config.microFrontend && config.microFrontendEngine) {
    renderMicroFrontendFeatures(config, targetDir, config.microFrontendEngine)
  }
}

/**
 * 渲染所有 EJS 模板
 * 包括主入口文件和 vite.config.ts，按照完整优先级查找模板
 * @param templatesDir 模板根目录
 * @param framework 框架类型
 * @param config 项目配置
 * @param ejsConfig EJS 模板配置
 * @param targetDir 目标目录
 * @throws {Error} 如果 EJS 模板渲染失败
 */
function renderEjsTemplates(
  templatesDir: string,
  framework: string,
  config: ProjectConfigType,
  ejsConfig: EjsTemplateConfig,
  targetDir: string,
): void {
  // 准备 EJS 数据
  const ejsData = {
    i18n: config.i18n,
    sentry: config.sentry,
    routeMode: config.routeMode,
    uiLibrary: config.uiLibrary,
    // Store management features
    pinia: config.pinia,
    zustand: config.zustand,
    // Router features (derived from routeMode)
    hasRouter: config.manualRoutes || config.pageRoutes,
  }

  // 渲染主入口文件 EJS 模板（完整优先级查找）
  const mainTemplatePath = getEjsTemplatePath(
    templatesDir,
    framework,
    config,
    ejsConfig.mainTemplate,
  )

  renderEjsToFile(
    mainTemplatePath,
    path.join(targetDir, ejsConfig.mainOutput),
    ejsData,
  )

  // Router 已通过 feature 覆盖实现（manualRoutes/pageRoutes），不再使用 EJS

  // 渲染 vite.config.ts（使用 EJS 模板，完整优先级查找）
  const viteConfigEjsData = getViteConfigEjsData(config)

  const viteConfigTemplatePath = getEjsTemplatePath(
    templatesDir,
    framework,
    config,
    'vite.config.ts.ejs',
  )

  renderEjsToFile(
    viteConfigTemplatePath,
    path.join(targetDir, 'vite.config.ts'),
    viteConfigEjsData,
  )
}

/**
 * 生成框架项目的通用函数
 * 按照三层嵌套优先级渲染模板：L1 (common) -> L2 (framework) -> L3 (micro-frontend)
 * @param config 项目配置
 * @param ejsConfig EJS 模板配置
 * @throws {Error} 如果模板渲染失败、文件写入失败或配置生成失败
 */
export function generateFrameworkProject(
  config: ProjectConfigType,
  ejsConfig: EjsTemplateConfig,
): void {
  const { targetDir, framework, microFrontend, microFrontendEngine } = config
  const templatesDir = getTemplatesDir()

  // 1. 渲染所有基础模板（base 模板）
  renderBaseTemplates(templatesDir, framework, microFrontend, microFrontendEngine, targetDir)

  // 2. 渲染所有特性模板（features）
  renderAllFeatures(config, targetDir)

  // 3. 渲染所有 EJS 模板
  renderEjsTemplates(templatesDir, framework, config, ejsConfig, targetDir)

  // 4. 更新 package.json 的元数据字段
  const packageJsonPath = path.join(targetDir, FILE_CONSTANTS.PACKAGE_JSON)
  updatePackageJsonMetadata(
    packageJsonPath,
    config.projectName,
    config.description,
    config.author,
    config.packageManager,
  )
}
