/**
 * 项目生成器
 * 根据配置生成完整的项目结构
 * 支持三层嵌套优先级 (L1: common, L2: framework, L3: micro-frontend)
 */

import type { ProjectConfigType } from '../types/index.ts'

import fs from 'node:fs'
import path from 'node:path'

import { FILE_CONSTANTS, FRAMEWORKS } from '../constants/index.ts'
import {
  renderCommonFeatures,
  renderFrameworkFeatures,
  renderMicroFrontendFeatures,
} from '../core/feature.ts'
import { renderTemplate, updatePackageJsonMetadata } from '../core/template.ts'
import { emptyDir, getTemplatesDir } from '../utils/file.ts'

// ============================================================================
// 内部函数
// ============================================================================

/**
 * 渲染所有基础模板
 * 按三层嵌套优先级渲染: L1 (common) -> L2 (framework) -> L3 (micro-frontend)
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
 * 渲染所有 feature 模板
 * 按三层嵌套优先级渲染: common features -> framework features -> micro-frontend features
 * @param config 项目配置
 * @param targetDir 目标目录
 * @throws {Error} 如果 feature 渲染失败
 */
function renderAllFeatures(
  config: ProjectConfigType,
  targetDir: string,
): void {
  // 1. 渲染公共 feature 模板
  renderCommonFeatures(config, targetDir)

  // 2. 渲染框架 feature 模板
  renderFrameworkFeatures(config, targetDir)

  // 3. 渲染微前端专属 features（覆盖标准 features）
  if (config.microFrontend && config.microFrontendEngine) {
    renderMicroFrontendFeatures(config, targetDir, config.microFrontendEngine)
  }
}

// ============================================================================
// 公共 API
// ============================================================================

/**
 * 生成项目
 * @param config 项目配置
 * @returns Promise<void>
 * @throws {Error} 如果框架不支持或项目生成失败
 */
export async function generateProject(config: ProjectConfigType): Promise<void> {
  // 验证框架是否支持
  if (!FRAMEWORKS.includes(config.framework)) {
    throw new Error(`不支持的框架: ${config.framework}`)
  }

  const { targetDir, framework, microFrontend, microFrontendEngine } = config
  const templatesDir = getTemplatesDir()

  // 清空并创建项目根目录（确保干净的构建环境）
  emptyDir(targetDir)

  // 1. 渲染所有基础模板
  renderBaseTemplates(templatesDir, framework, microFrontend, microFrontendEngine, targetDir)

  // 2. 渲染所有 feature 模板
  renderAllFeatures(config, targetDir)

  // 3. 更新 package.json 元数据字段
  const packageJsonPath = path.join(targetDir, FILE_CONSTANTS.PACKAGE_JSON)
  updatePackageJsonMetadata(
    packageJsonPath,
    config.projectName,
    config.description,
    config.author,
    config.packageManager,
  )

  // 4. 清理包管理器特定文件（只有 yarn 需要 .yarnrc.yml）
  if (config.packageManager !== 'yarn') {
    const yarnrcPath = path.join(targetDir, '.yarnrc.yml')
    if (fs.existsSync(yarnrcPath)) {
      fs.unlinkSync(yarnrcPath)
    }
  }
}
