/**
 * 依赖安装工具
 * 执行包管理器安装依赖
 */

import type { PackageManagerType } from '../types/index.ts'

import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

/**
 * 验证命令参数安全性
 * @param packageManager 包管理器类型
 * @param cwd 工作目录
 * @throws {Error} 如果参数不安全
 */
function validateInstallParams(packageManager: PackageManagerType, cwd: string): void {
  // 验证包管理器类型
  const validPackageManagers: PackageManagerType[] = ['pnpm', 'npm', 'yarn']
  if (!validPackageManagers.includes(packageManager)) {
    throw new Error(`不支持的包管理器: ${packageManager}`)
  }

  // 验证工作目录路径（防止路径遍历攻击）
  if (cwd.includes('..') || cwd.includes('~')) {
    throw new Error(`不安全的工作目录路径: ${cwd}`)
  }
}

/**
 * 安装依赖
 * @param packageManager 包管理器
 * @param cwd 工作目录
 * @param retries 重试次数，默认 0（不重试）
 * @returns Promise<void>
 * @throws {Error} 如果安装失败
 */
export async function installDependencies(
  packageManager: PackageManagerType,
  cwd: string,
  retries = 0,
): Promise<void> {
  // 验证参数安全性
  validateInstallParams(packageManager, cwd)

  const commands: Record<PackageManagerType, string> = {
    pnpm: 'pnpm install',
    npm: 'npm install',
    yarn: 'yarn install',
  }

  const command = commands[packageManager]

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await execAsync(command, {
        cwd,
      })
      return // 成功则返回
    }
    catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retries) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  // 所有重试都失败，抛出详细错误
  throw new Error(
    `依赖安装失败 (${packageManager}): ${lastError?.message || '未知错误'}\n`
    + `工作目录: ${cwd}\n`
    + `命令: ${command}`,
    { cause: lastError },
  )
}

/**
 * 初始化 Git 仓库
 * @param cwd 工作目录
 * @returns Promise<void>
 */
export async function initGit(cwd: string): Promise<void> {
  try {
    // 验证路径安全性
    if (cwd.includes('..') || cwd.includes('~')) {
      throw new Error(`不安全的工作目录路径: ${cwd}`)
    }

    await execAsync('git init', { cwd })
    await execAsync('git add .', { cwd })
    await execAsync('git commit -m "chore: initial commit"', { cwd })
  }
  catch {
    // Git 初始化失败不影响项目创建，静默失败
  }
}
