/**
 * 测试工具函数
 * 提供通用的测试辅助功能
 */

import path from 'node:path'
import fs from 'fs-extra'
import os from 'node:os'
import process from 'node:process'

const managedTempDirs = new Set<string>()

export const TRANSPARENT_AJAX_SOURCE_FILES = [
  'BaseApi.ts',
  'BaseHttpClient.ts',
  'errors.ts',
  'factory.ts',
  'index.ts',
  'path.ts',
  'readValueByPath.ts',
  'types.ts',
] as const
/**
 * 创建临时测试目录
 * @param prefix 目录前缀
 * @returns 临时目录路径
 */
export async function createTempDir(prefix = 'vite-cli-test-'): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  await fs.ensureDir(tempDir)
  managedTempDirs.add(path.resolve(tempDir))
  return tempDir
}

/**
 * 清理临时测试目录
 * @param dir 目录路径
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  const tempRoot = path.resolve(os.tmpdir())
  const targetDir = path.resolve(dir)
  const isManagedTempDir = targetDir.startsWith(`${tempRoot}${path.sep}`)
    && managedTempDirs.has(targetDir)

  if (!isManagedTempDir) {
    throw new Error(`拒绝清理非 vite-cli 临时目录: ${targetDir}`)
  }
  if (fs.existsSync(targetDir)) {
    await fs.remove(targetDir)
  }
  managedTempDirs.delete(targetDir)
}

/**
 * 检查文件是否存在
 * @param projectDir 项目目录
 * @param filePath 相对文件路径
 * @returns 是否存在
 */
export function checkFileExists(projectDir: string, filePath: string): boolean {
  return fs.existsSync(path.join(projectDir, filePath))
}

/**
 * 检查多个文件是否存在
 * @param projectDir 项目目录
 * @param filePaths 相对文件路径数组
 * @returns 检查结果
 */
export function checkFilesExist(
  projectDir: string,
  filePaths: string[],
): { exists: string[], missing: string[] } {
  const exists: string[] = []
  const missing: string[] = []

  for (const filePath of filePaths) {
    if (checkFileExists(projectDir, filePath)) {
      exists.push(filePath)
    }
    else {
      missing.push(filePath)
    }
  }

  return { exists, missing }
}

/**
 * 读取文件内容
 * @param projectDir 项目目录
 * @param filePath 相对文件路径
 * @returns 文件内容
 */
export async function readFileContent(projectDir: string, filePath: string): Promise<string> {
  return fs.readFile(path.join(projectDir, filePath), 'utf-8')
}

/**
 * 读取 JSON 文件
 * @param projectDir 项目目录
 * @param filePath 相对文件路径
 * @returns JSON 对象
 */
export async function readJsonFile(projectDir: string, filePath: string): Promise<any> {
  return await fs.readJson(path.join(projectDir, filePath))
}

/**
 * 检查文件内容是否包含特定字符串
 * @param projectDir 项目目录
 * @param filePath 相对文件路径
 * @param content 要查找的内容
 * @returns 是否包含
 */
export async function fileContains(
  projectDir: string,
  filePath: string,
  content: string,
): Promise<boolean> {
  const fileContent = await readFileContent(projectDir, filePath)
  return fileContent.includes(content)
}

/**
 * 等待一段时间
 * @param ms 毫秒数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 获取测试输出目录
 * @returns 测试输出目录路径
 */
export function getTestOutputDir(): string {
  return path.resolve(process.cwd(), 'test-output')
}

/**
 * 确保测试输出目录存在并清空
 */
export async function ensureTestOutputDir(): Promise<string> {
  const testOutputDir = getTestOutputDir()
  if (fs.existsSync(testOutputDir)) {
    await fs.remove(testOutputDir)
  }
  await fs.ensureDir(testOutputDir)
  return testOutputDir
}
