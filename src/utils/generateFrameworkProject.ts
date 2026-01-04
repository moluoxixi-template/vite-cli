/**
 * 框架项目生成通用工具
 * 抽离 react.ts 和 vue.ts 的公共逻辑
 * 支持三层嵌套优先级（L1: common, L2: framework, L3: micro-frontend）
 */

import type { ProjectConfigType } from '../types/index.ts'

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

  // 1. 渲染 L1: 公共基础模板（通用层）
  renderTemplate(path.join(templatesDir, 'common', 'base'), targetDir)

  // 2. 渲染公共特性模板
  renderCommonFeatures(config, targetDir)

  // 3. 渲染 L2: 框架基础模板（框架标准层）
  renderTemplate(path.join(templatesDir, framework, 'base'), targetDir)

  // 4. 渲染 L2: 框架特性模板（统一处理）
  renderFrameworkFeatures(config, targetDir)

  // 5. 渲染 L3: 微前端镜像模板（架构增强层）- 按需覆盖
  if (microFrontend && microFrontendEngine) {
    const microFrontendPath = path.join(
      templatesDir,
      framework,
      'micro-frontends',
      microFrontendEngine,
      'base',
    )
    renderTemplate(microFrontendPath, targetDir)

    // 渲染微前端专属的 features（覆盖标准 features）
    renderMicroFrontendFeatures(config, targetDir, microFrontendEngine)
  }

  // 6. 渲染 EJS 模板
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

  // 根据是否启用微前端选择模板路径
  let mainTemplatePath: string
  if (microFrontend && microFrontendEngine) {
    // L3: 微前端模板路径
    const microFrontendBasePath = path.join(
      templatesDir,
      framework,
      'micro-frontends',
      microFrontendEngine,
      'base',
    )
    mainTemplatePath = path.join(microFrontendBasePath, ejsConfig.mainTemplate)
  }
  else {
    // L2: 标准框架模板路径
    const frameworkBasePath = path.join(templatesDir, framework, 'base')
    mainTemplatePath = path.join(frameworkBasePath, ejsConfig.mainTemplate)
  }

  renderEjsToFile(
    mainTemplatePath,
    path.join(targetDir, ejsConfig.mainOutput),
    ejsData,
  )

  // Router 已通过 feature 覆盖实现（manualRoutes/pageRoutes），不再使用 EJS

  // 7. 数据驱动生成 vite.config.ts（使用 EJS 模板）
  const viteConfigEjsData = getViteConfigEjsData(config)

  let viteConfigTemplatePath: string
  if (microFrontend && microFrontendEngine) {
    // L3: 使用微前端专属的 vite.config.ts 模板
    const microFrontendBasePath = path.join(
      templatesDir,
      framework,
      'micro-frontends',
      microFrontendEngine,
      'base',
    )
    viteConfigTemplatePath = path.join(microFrontendBasePath, 'vite.config.ts.ejs')
  }
  else {
    // L1: 使用标准的 vite.config.ts 模板
    const commonBasePath = path.join(templatesDir, 'common', 'base')
    viteConfigTemplatePath = path.join(commonBasePath, 'vite.config.ts.ejs')
  }

  renderEjsToFile(
    viteConfigTemplatePath,
    path.join(targetDir, 'vite.config.ts'),
    viteConfigEjsData,
  )

  // 8. 更新 package.json 的元数据字段
  const packageJsonPath = path.join(targetDir, FILE_CONSTANTS.PACKAGE_JSON)
  updatePackageJsonMetadata(
    packageJsonPath,
    config.projectName,
    config.description,
    config.author,
    config.packageManager,
  )
}
