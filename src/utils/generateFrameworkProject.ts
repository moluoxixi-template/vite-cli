/**
 * 框架项目生成通用工具
 * 抽离 react.ts 和 vue.ts 的公共逻辑
 */

import type { ProjectConfigType } from '../types/index.ts'

import path from 'node:path'

import { FILE_CONSTANTS } from '../constants/index.ts'
import { renderEjsToFile } from './ejs.ts'
import { getTemplatesDir } from './file.ts'
import { renderCommonFeatures, renderFrameworkFeatures } from './renderFeatures.ts'
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
  /** 路由文件模板路径（相对于框架 base 目录） */
  routerTemplate: string
  /** 路由文件输出路径（相对于目标目录） */
  routerOutput: string
}

/**
 * 生成框架项目的通用函数
 * @param config 项目配置
 * @param ejsConfig EJS 模板配置
 * @throws {Error} 如果模板渲染失败、文件写入失败或配置生成失败
 */
export function generateFrameworkProject(
  config: ProjectConfigType,
  ejsConfig: EjsTemplateConfig,
): void {
  const { targetDir, framework } = config
  const templatesDir = getTemplatesDir()

  // 1. 渲染 L0 公共基础模板
  renderTemplate(path.join(templatesDir, 'common', 'base'), targetDir)

  // 2. 渲染公共特性模板
  renderCommonFeatures(config, targetDir)

  // 3. 渲染 L1 框架基础模板
  renderTemplate(path.join(templatesDir, framework, 'base'), targetDir)

  // 4. 渲染 L2 特性模板（统一处理）
  renderFrameworkFeatures(config, targetDir)

  // 5. 渲染 EJS 模板
  const ejsData = {
    i18n: config.i18n,
    sentry: config.sentry,
    qiankun: config.qiankun,
    routeMode: config.routeMode,
    uiLibrary: config.uiLibrary,
  }

  const frameworkBasePath = path.join(templatesDir, framework, 'base')

  renderEjsToFile(
    path.join(frameworkBasePath, ejsConfig.mainTemplate),
    path.join(targetDir, ejsConfig.mainOutput),
    ejsData,
  )

  renderEjsToFile(
    path.join(frameworkBasePath, ejsConfig.routerTemplate),
    path.join(targetDir, ejsConfig.routerOutput),
    ejsData,
  )

  // 6. 数据驱动生成 vite.config.ts（使用 EJS 模板）
  const viteConfigEjsData = getViteConfigEjsData(config)
  const commonBasePath = path.join(templatesDir, 'common', 'base')
  renderEjsToFile(
    path.join(commonBasePath, 'vite.config.ts.ejs'),
    path.join(targetDir, 'vite.config.ts'),
    viteConfigEjsData,
  )

  // 7. 更新 package.json 的元数据字段
  const packageJsonPath = path.join(targetDir, FILE_CONSTANTS.PACKAGE_JSON)
  updatePackageJsonMetadata(
    packageJsonPath,
    config.projectName,
    config.description,
    config.author,
    config.packageManager,
  )
}
