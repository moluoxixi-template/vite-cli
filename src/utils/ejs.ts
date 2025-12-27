/**
 * EJS 模板渲染工具
 */

import type { EjsDataType } from '../types'

import fs from 'node:fs'
import path from 'node:path'

import ejs from 'ejs'

/**
 * 渲染 EJS 模板文件
 * @param templatePath 模板文件路径
 * @param data 模板数据
 * @returns 渲染后的字符串内容
 */
export function renderEjsFile(templatePath: string, data: EjsDataType): string {
  const template = fs.readFileSync(templatePath, 'utf-8')
  return ejs.render(template, data, {
    filename: templatePath,
  })
}

/**
 * 渲染 EJS 模板并写入目标文件
 * @param templatePath 模板文件路径
 * @param targetPath 目标文件路径
 * @param data 模板数据
 */
export function renderEjsToFile(
  templatePath: string,
  targetPath: string,
  data: EjsDataType,
): void {
  const content = renderEjsFile(templatePath, data)
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.writeFileSync(targetPath, content)
}
