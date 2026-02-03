#!/usr/bin/env node

/**
 * Vite Template CLI
 * 用于快速创建 Vue 3 或 React 项目的脚手架工具
 */

import { Command } from 'commander'
import { createProject } from './commands/create'
import { getVersion } from './utils/version'

// 创建 CLI 程序实例
const program = new Command()

// 配置 CLI 基本信息
program
  .name('vite-cli')
  .description('Vite template CLI for creating Vue/React projects')
  .version(getVersion())

// 注册 create 命令
program
  .command('create')
  .alias('c')
  .description('Create a new project')
  .argument('[project-name]', 'Project name')
  .action(async (projectName?: string) => {
    await createProject(projectName)
  })

// 解析命令行参数
program.parse()
