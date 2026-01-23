/**
 * 快照测试辅助工具
 * 用于生成可用于快照比较的规范化内容
 */

import path from 'node:path'
import fs from 'fs-extra'

/**
 * 需要进行快照测试的关键文件列表
 */
export const SNAPSHOT_FILES = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'src/main.ts',
  'src/App.vue', // Vue 项目
  'src/App.tsx', // React 项目
  'index.html',
] as const

/**
 * 规范化 package.json 用于快照比较
 * 移除不稳定的字段（版本号、时间戳等）
 * @param packageJson - package.json 内容
 * @returns 规范化后的对象
 */
export function normalizePackageJson(packageJson: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...packageJson }

  // 移除动态字段
  delete normalized.name // 项目名称是动态的
  delete normalized.description // 描述是动态的
  delete normalized.author // 作者是动态的
  delete normalized.packageManager // 版本号是动态的

  // 规范化依赖版本（只保留包名，移除版本号）
  const normalizeDeps = (deps: Record<string, string> | undefined) => {
    if (!deps)
      return undefined
    return Object.keys(deps).sort()
  }

  if (normalized.dependencies) {
    normalized.dependencies = normalizeDeps(normalized.dependencies as Record<string, string>)
  }
  if (normalized.devDependencies) {
    normalized.devDependencies = normalizeDeps(normalized.devDependencies as Record<string, string>)
  }

  return normalized
}

/**
 * 规范化文件内容用于快照比较
 * 移除注释中的时间戳、动态导入路径等
 * @param content - 文件内容
 * @param _filename - 文件名（保留用于未来扩展）
 * @returns 规范化后的内容
 */
export function normalizeFileContent(content: string, _filename: string): string {
  let normalized = content

  // 移除时间戳注释
  normalized = normalized.replace(/\/\/\s*Generated at:.*/g, '')
  normalized = normalized.replace(/\/\*\s*Generated at:[\s\S]*?\*\//g, '')

  // 规范化换行符
  normalized = normalized.replace(/\r\n/g, '\n')

  // 移除尾部空白
  normalized = normalized
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')

  return normalized.trim()
}

/**
 * 生成项目结构快照
 * @param projectDir - 项目目录
 * @param maxDepth - 最大深度
 * @returns 目录结构字符串
 */
export function generateStructureSnapshot(projectDir: string, maxDepth = 3): string {
  const lines: string[] = []

  /**
   * 递归遍历目录
   * @param dir - 当前目录
   * @param prefix - 前缀字符串
   * @param depth - 当前深度
   */
  function walk(dir: string, prefix: string, depth: number): void {
    if (depth > maxDepth)
      return

    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
      .sort((a, b) => {
        // 目录优先
        if (a.isDirectory() && !b.isDirectory())
          return -1
        if (!a.isDirectory() && b.isDirectory())
          return 1
        return a.name.localeCompare(b.name)
      })

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const isLast = i === entries.length - 1
      const connector = isLast ? '└── ' : '├── '
      const childPrefix = isLast ? '    ' : '│   '

      lines.push(`${prefix}${connector}${entry.name}${entry.isDirectory() ? '/' : ''}`)

      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), prefix + childPrefix, depth + 1)
      }
    }
  }

  lines.push(`${path.basename(projectDir)}/`)
  walk(projectDir, '', 1)

  return lines.join('\n')
}

/**
 * 收集项目快照数据
 * @param projectDir - 项目目录
 * @param framework - 框架类型
 * @returns 快照数据对象
 */
export async function collectSnapshotData(
  projectDir: string,
  framework: string,
): Promise<Record<string, unknown>> {
  const snapshot: Record<string, unknown> = {
    structure: generateStructureSnapshot(projectDir),
  }

  for (const file of SNAPSHOT_FILES) {
    const filePath = path.join(projectDir, file)

    // 跳过框架不匹配的文件
    if (file.endsWith('.vue') && framework !== 'vue')
      continue
    if (file.endsWith('.tsx') && framework !== 'react')
      continue

    if (await fs.pathExists(filePath)) {
      const content = await fs.readFile(filePath, 'utf-8')

      if (file === 'package.json') {
        const packageJson = JSON.parse(content)
        snapshot[file] = normalizePackageJson(packageJson)
      }
      else {
        snapshot[file] = normalizeFileContent(content, file)
      }
    }
  }

  return snapshot
}
