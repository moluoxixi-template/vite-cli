/**
 * 依赖安装工具
 * 执行包管理器安装命令
 */

import type { PackageManager } from '../types'
import { execSync } from 'node:child_process'

/**
 * 安装项目依赖
 * @param packageManager 包管理器
 * @param targetDir 目标目录
 */
export function installDependencies(
  packageManager: PackageManager,
  targetDir: string,
): void {
  try {
    console.log(`\nInstalling dependencies with ${packageManager}...`)

    // 根据包管理器执行不同的安装命令
    let command: string
    switch (packageManager) {
      case 'pnpm':
        command = 'pnpm install'
        break
      case 'yarn':
        command = 'yarn install'
        break
      case 'npm':
      default:
        command = 'npm install'
        break
    }

    // 执行安装命令
    execSync(command, {
      cwd: targetDir,
      stdio: 'inherit',
    })

    console.log('\n✅ Dependencies installed successfully!')
  }
  catch (error) {
    console.error('\n❌ Failed to install dependencies:', error)
    throw error
  }
}
