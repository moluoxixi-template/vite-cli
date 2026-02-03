/**
 * 模板渲染工具
 * 使用 ejs 渲染模板文件
 */

import type { ProjectConfig } from '../types'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ejs from 'ejs'
import fs from 'fs-extra'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 获取模板目录路径
 * @returns 模板目录绝对路径
 */
function getTemplateDir(): string {
  return join(__dirname, '../../templates')
}

/**
 * 渲染模板文件
 * @param templatePath 模板文件路径（相对于模板目录）
 * @param targetPath 目标文件路径
 * @param config 项目配置
 */
export function renderTemplate(
  templatePath: string,
  targetPath: string,
  config: ProjectConfig,
): void {
  try {
    // 读取模板文件
    const template = readFileSync(
      join(getTemplateDir(), templatePath),
      'utf-8',
    )

    // 使用 ejs 渲染模板
    const content = ejs.render(template, {
      // 项目配置
      config,
      // 辅助函数：判断是否为 Vue
      isVue: config.framework === 'vue',
      // 辅助函数：判断是否为 React
      isReact: config.framework === 'react',
      // 辅助函数：判断是否为文件系统路由
      isFileSystemRoute: config.routeMode === 'file-system',
      // 辅助函数：判断是否为手动路由
      isManualRoute: config.routeMode === 'manual',
      // 辅助函数：判断 UI 库
      isElementPlus: config.uiLibrary === 'element-plus',
      isAntDesignVue: config.uiLibrary === 'ant-design-vue',
      isAntDesign: config.uiLibrary === 'ant-design',
    })

    // 确保目标目录存在
    fs.ensureDirSync(dirname(targetPath))
    // 写入目标文件
    writeFileSync(targetPath, content, 'utf-8')
  }
  catch (error) {
    throw new Error(`Failed to render template ${templatePath}: ${error}`)
  }
}

/**
 * 获取模板文件路径
 * @param templatePath 模板文件路径（相对于模板目录）
 * @returns 模板文件绝对路径
 */
export function getTemplatePath(templatePath: string): string {
  return join(getTemplateDir(), templatePath)
}
