/**
 * 文件操作工具
 * 处理文件复制、创建目录等操作
 */

import type { ProjectConfig } from '../types'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import fs from 'fs-extra'
import { getTemplatePath, renderTemplate } from './template'

/**
 * 复制文件或目录
 * @param src 源路径
 * @param dest 目标路径
 */
export function copyFile(src: string, dest: string): void {
  fs.ensureDirSync(dirname(dest))
  fs.copySync(src, dest, {
    overwrite: true,
  })
}

/**
 * 创建目录
 * @param dirPath 目录路径
 */
export function createDir(dirPath: string): void {
  fs.ensureDirSync(dirPath)
}

/**
 * 检查文件或目录是否存在
 * @param path 路径
 * @returns 是否存在
 */
export function pathExists(path: string): boolean {
  return fs.existsSync(path)
}

/**
 * 复制模板文件并渲染
 * @param templatePath 模板文件路径（相对于模板目录）
 * @param targetPath 目标文件路径
 * @param config 项目配置
 */
export function copyAndRenderTemplate(
  templatePath: string,
  targetPath: string,
  config: ProjectConfig,
): void {
  fs.ensureDirSync(dirname(targetPath))
  renderTemplate(templatePath, targetPath, config)
}

/**
 * 复制静态文件（不需要渲染）
 * @param templatePath 模板文件路径（相对于模板目录）
 * @param targetPath 目标文件路径
 */
export function copyStaticFile(templatePath: string, targetPath: string): void {
  const srcPath = getTemplatePath(templatePath)
  fs.ensureDirSync(dirname(targetPath))
  copyFile(srcPath, targetPath)
}

/**
 * 读取文件内容
 * @param filePath 文件路径
 * @returns 文件内容
 */
export function readFile(filePath: string): string {
  return readFileSync(filePath, 'utf-8')
}

/**
 * 写入文件内容
 * @param filePath 文件路径
 * @param content 文件内容
 */
export function writeFile(filePath: string, content: string): void {
  fs.ensureDirSync(dirname(filePath))
  writeFileSync(filePath, content, 'utf-8')
}
