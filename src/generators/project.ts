/**
 * 项目生成器
 * 根据配置生成完整的项目结构
 */

import type { ProjectConfig } from '../types'
import { createDir } from '../utils/file'
import { generateReactProject } from './react'
import { generateVueProject } from './vue'

/**
 * 生成项目
 * @param config 项目配置
 */
export async function generateProject(config: ProjectConfig): Promise<void> {
  // 创建项目根目录
  createDir(config.targetDir)

  // 根据框架类型生成不同的项目结构
  if (config.framework === 'vue') {
    await generateVueProject(config)
  }
  else if (config.framework === 'react') {
    await generateReactProject(config)
  }
  else {
    throw new Error(`Unsupported framework: ${config.framework}`)
  }
}
