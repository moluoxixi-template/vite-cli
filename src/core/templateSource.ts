/**
 * 模板源码制品的共享文件契约。
 * ZIP 与 StackBlitz 必须消费同一组排序后的生成项目文件。
 */

import type { ProjectConfigType } from '../types/index.ts'
import type { StackBlitzProjectPayload } from './templateGallery.ts'

import path from 'node:path'

import fs from 'fs-extra'

const EXCLUDED_DIRECTORY_NAMES = new Set([
  '.cache',
  '.git',
  '.turbo',
  '.vite',
  'coverage',
  'dist',
  'logs',
  'node_modules',
  'temp',
  'tmp',
])

const EXCLUDED_FILE_PATTERNS = [
  /\.log$/i,
  /\.tsbuildinfo$/i,
  /^(?:lerna|npm|pnpm|yarn)-(?:debug|error)\.log/i,
  /^\.DS_Store$/,
]

export interface TemplateSourceEntry {
  absolutePath: string
  relativePath: string
}

const STACKBLITZ_EXCLUDED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
])

/**
 * 收集 ZIP 与 StackBlitz 共用的稳定源码文件集合。
 * @param projectDir 已生成的完整项目目录
 * @returns 按 POSIX 相对路径排序的普通文件
 */
export async function collectTemplateSourceEntries(projectDir: string): Promise<TemplateSourceEntry[]> {
  const entries: TemplateSourceEntry[] = []
  await collectDirectoryEntries(projectDir, '', entries)
  return entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath))
}

/**
 * 创建 StackBlitz SDK 接受的文本文件映射。
 * @param projectDir 已生成的完整项目目录
 * @param config 项目配置
 * @param entries 可复用的源码文件集合
 * @returns StackBlitz node 项目载荷
 */
export async function createStackBlitzProject(
  projectDir: string,
  config: ProjectConfigType,
  entries?: TemplateSourceEntry[],
): Promise<StackBlitzProjectPayload> {
  const sourceEntries = entries || await collectTemplateSourceEntries(projectDir)
  const files: Record<string, string> = {}
  const decoder = new TextDecoder('utf-8', { fatal: true })

  for (const entry of sourceEntries) {
    if (STACKBLITZ_EXCLUDED_FILES.has(entry.relativePath)) {
      continue
    }
    const content = await fs.readFile(entry.absolutePath)
    try {
      files[entry.relativePath] = decoder.decode(content)
    }
    catch (error) {
      throw new TypeError(`StackBlitz 不支持二进制文件: ${entry.relativePath}`, { cause: error })
    }
  }

  return {
    title: config.projectName,
    description: config.description,
    template: 'node',
    files,
  }
}

async function collectDirectoryEntries(
  projectDir: string,
  relativeDir: string,
  entries: TemplateSourceEntry[],
): Promise<void> {
  const directoryPath = path.join(projectDir, ...relativeDir.split('/').filter(Boolean))
  const directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true })

  for (const directoryEntry of directoryEntries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = [relativeDir, directoryEntry.name].filter(Boolean).join('/')
    if (shouldExclude(relativePath, directoryEntry.isDirectory())) {
      continue
    }

    const absolutePath = path.join(projectDir, ...relativePath.split('/'))
    const stat = await fs.lstat(absolutePath)
    if (stat.isSymbolicLink()) {
      throw new TypeError(`模板源码不允许符号链接: ${relativePath}`)
    }
    if (stat.isDirectory()) {
      await collectDirectoryEntries(projectDir, relativePath, entries)
    }
    else if (stat.isFile()) {
      entries.push({ absolutePath, relativePath })
    }
    else {
      throw new TypeError(`模板源码包含不支持的文件类型: ${relativePath}`)
    }
  }
}

function shouldExclude(relativePath: string, isDirectory: boolean): boolean {
  const segments = relativePath.split('/')
  const fileName = segments.at(-1) || ''
  if (isDirectory && EXCLUDED_DIRECTORY_NAMES.has(fileName)) {
    return true
  }
  if (relativePath === '.husky/_' || relativePath.startsWith('.husky/_/')) {
    return true
  }
  return !isDirectory && EXCLUDED_FILE_PATTERNS.some(pattern => pattern.test(fileName))
}
