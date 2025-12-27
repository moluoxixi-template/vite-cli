#!/usr/bin/env node

/**
 * CLI 入口文件
 * 基于原子化分层叠加架构的项目脚手架
 */

import { Command } from 'commander'

import { createProject } from './commands/create'

const program = new Command()

program
  .name('create-mox')
  .description('基于原子化分层叠加架构的 Vue/React 项目脚手架')
  .version('1.0.0')

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
