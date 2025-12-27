/**
 * 依赖安装工具
 * 执行包管理器安装依赖
 */

import type { PackageManagerType } from '../types'

import { execSync } from 'node:child_process'

/**
 * 安装依赖
 * @param packageManager 包管理器
 * @param cwd 工作目录
 */
export function installDependencies(
  packageManager: PackageManagerType,
  cwd: string,
): void {
  const commands: Record<PackageManagerType, string> = {
    pnpm: 'pnpm install',
    npm: 'npm install',
    yarn: 'yarn install',
  }

  const command = commands[packageManager]

  execSync(command, {
    cwd,
    stdio: 'inherit',
  })
}

/**
 * 初始化 Git 仓库
 * @param cwd 工作目录
 */
export function initGit(cwd: string): void {
  try {
    execSync('git init', { cwd, stdio: 'ignore' })
    execSync('git add .', { cwd, stdio: 'ignore' })
    execSync('git commit -m "chore: initial commit"', { cwd, stdio: 'ignore' })
  }
  catch {
    // Git 初始化失败不影响项目创建
  }
}
