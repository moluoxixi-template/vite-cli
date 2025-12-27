/**
 * 文件操作工具
 * 文件和目录操作相关函数
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import fs from 'fs-extra'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 创建目录
 * @param dirPath 目录路径
 */
export function createDir(dirPath: string): void {
  fs.ensureDirSync(dirPath)
}

/**
 * 清空并重新创建目录
 * @param dirPath 目录路径
 */
export function emptyDir(dirPath: string): void {
  fs.emptyDirSync(dirPath)
}

/**
 * 检查路径是否存在
 * @param filePath 文件路径
 */
export function pathExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

/**
 * 复制文件
 * @param src 源文件路径
 * @param dest 目标文件路径
 */
export function copyFile(src: string, dest: string): void {
  fs.ensureDirSync(path.dirname(dest))
  fs.copyFileSync(src, dest)
}

/**
 * 复制目录
 * @param src 源目录路径
 * @param dest 目标目录路径
 */
export function copyDir(src: string, dest: string): void {
  fs.copySync(src, dest)
}

/**
 * 写入文件
 * @param filePath 文件路径
 * @param content 文件内容
 */
export function writeFile(filePath: string, content: string): void {
  fs.ensureDirSync(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
}

/**
 * 读取文件
 * @param filePath 文件路径
 */
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * 读取 JSON 文件
 * @param filePath 文件路径
 */
export function readJsonFile<T = Record<string, unknown>>(filePath: string): T {
  return fs.readJsonSync(filePath)
}

/**
 * 写入 JSON 文件
 * @param filePath 文件路径
 * @param data 数据
 */
export function writeJsonFile(filePath: string, data: unknown): void {
  fs.ensureDirSync(path.dirname(filePath))
  fs.writeJsonSync(filePath, data, { spaces: 2 })
}

/**
 * 获取目录下所有文件
 * @param dirPath 目录路径
 * @param recursive 是否递归
 */
export function getFiles(dirPath: string, recursive = true): string[] {
  const files: string[] = []

  if (!fs.existsSync(dirPath)) {
    return files
  }

  const items = fs.readdirSync(dirPath)

  for (const item of items) {
    const itemPath = path.join(dirPath, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      if (recursive) {
        files.push(...getFiles(itemPath, recursive))
      }
    }
    else {
      files.push(itemPath)
    }
  }

  return files
}

/**
 * 获取模板目录路径
 */
export function getTemplatesDir(): string {
  return path.resolve(__dirname, '../../templates')
}

/**
 * 获取相对路径
 * @param from 起始路径
 * @param to 目标路径
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to)
}
