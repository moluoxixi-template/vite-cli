#!/usr/bin/env node

/**
 * CLI 入口文件
 * 基于原子化分层叠加架构的项目脚手架
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { Command } from 'commander'

import { createProject } from './commands/index.ts'

/**
 * 获取 package.json 中的版本号
 * @returns 版本号字符串
 */
function getVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const packageJsonPath = join(__dirname, '../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return packageJson.version || '1.0.0'
  }
  catch {
    return '1.0.0'
  }
}

const program = new Command()

program
  .name('create-mox')
  .description('基于原子化分层叠加架构的 Vue/React 项目脚手架')
  .version(getVersion())

program
  .command('create [project-name]')
  .description('创建新项目')
  .action(async (projectName?: string) => {
    await createProject(projectName)
  })

// 默认命令：直接运行时创建项目
program
  .argument('[project-name]', '项目名称')
  .action(async (projectName?: string) => {
    await createProject(projectName)
  })

program.parse()
