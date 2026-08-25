/**
 * 模板源码制品的共享文件契约。
 * ZIP 与 StackBlitz 必须消费同一组排序后的生成项目文件。
 */

import type { ProjectConfigType } from '../types/index.ts'
import type { StackBlitzProjectPayload } from './templateGallery.ts'

import { Buffer } from 'node:buffer'
import path from 'node:path'

import fs from 'fs-extra'

import {
  createStackBlitzStartCommand,
  STACKBLITZ_PACKAGE_MANAGER,
} from './templateGallery.ts'

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

  prepareStackBlitzFiles(files, config)

  return {
    title: config.projectName,
    description: config.description,
    template: 'node',
    files,
  }
}

function prepareStackBlitzFiles(files: Record<string, string>, config: ProjectConfigType): void {
  const envFile = files['.env']
  if (envFile === undefined) {
    throw new TypeError('StackBlitz 项目缺少 .env')
  }
  const environmentFiles = ['.env.development', '.env.production'] as const
  for (const fileName of environmentFiles) {
    if (files[fileName] === undefined) {
      throw new TypeError(`StackBlitz 项目缺少 ${fileName}`)
    }
  }
  let injectedEnvironment = setEnvironmentVariable(envFile, 'VITE_APP_CODE', '')
  if (config.microFrontend && config.microFrontendEngine === 'qiankun') {
    injectedEnvironment = setEnvironmentVariable(injectedEnvironment, 'VITE_STANDALONE', 'true')
  }
  delete files['.env']

  const packageJsonContent = files['package.json']
  if (packageJsonContent === undefined) {
    throw new TypeError('StackBlitz 项目缺少 package.json')
  }
  const packageJson = JSON.parse(packageJsonContent) as {
    packageManager?: string
    devDependencies?: Record<string, string>
    scripts?: Record<string, unknown>
  }
  if (typeof packageJson.scripts?.dev !== 'string') {
    throw new TypeError('StackBlitz 项目缺少 dev script')
  }

  packageJson.packageManager = STACKBLITZ_PACKAGE_MANAGER
  if (packageJson.devDependencies?.sass) {
    delete packageJson.devDependencies['sass-embedded']
  }
  files['package.json'] = `${JSON.stringify(packageJson, null, 2)}\n`
  files['.stackblitzrc'] = `${JSON.stringify({
    installDependencies: false,
    startCommand: createStackBlitzStartCommand(
      Buffer.from(injectedEnvironment, 'utf-8').toString('base64'),
    ),
  }, null, 2)}\n`
}

function setEnvironmentVariable(content: string, name: string, value: string): string {
  const lines = content.split(/\r?\n/).filter(line => getEnvironmentVariableName(line) !== name)
  const entry = `${name}=${value}`
  lines.push(entry)
  return lines.join('\n')
}

function getEnvironmentVariableName(line: string): string | undefined {
  return /^\s*([A-Z_][A-Z0-9_]*)\s*=/.exec(line)?.[1]
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
