/**
 * Create 命令
 * 创建新项目的核心逻辑
 */

import process from 'node:process'

import chalk from 'chalk'
import ora from 'ora'

import { collectProjectConfig, confirmOverwrite } from '../core/prompts.ts'
import { generateProject } from '../generators/project.ts'
import { MOLUOXIXI_DEPS } from '../types/features.ts'
import { pathExists } from '../utils/file.ts'
import { initGit, installDependencies } from '../utils/install.ts'

/**
 * 创建项目
 * @param projectName 项目名称（可选）
 * @returns Promise<void>
 * @throws {Error} 如果项目创建过程中发生错误
 */
export async function createProject(projectName?: string): Promise<void> {
  try {
    // 显示欢迎信息
    console.log(chalk.blue.bold('\n🚀 欢迎使用 Vite Template CLI!\n'))
    console.log(chalk.gray('基于原子化分层叠加架构的项目脚手架\n'))

    // 收集项目配置
    const config = await collectProjectConfig(projectName)

    // 检查目标目录是否已存在
    if (pathExists(config.targetDir)) {
      const shouldOverwrite = await confirmOverwrite(config.targetDir)
      if (!shouldOverwrite) {
        console.log(chalk.yellow('\n⚠️  已取消创建项目\n'))
        process.exit(0)
      }
    }

    // 显示配置摘要
    console.log(chalk.green('\n📋 项目配置:'))
    console.log(chalk.gray(`  项目名称: ${chalk.white(config.projectName)}`))
    console.log(chalk.gray(`  框架: ${chalk.white(config.framework)}`))
    console.log(chalk.gray(`  UI 组件库: ${chalk.white(config.uiLibrary)}`))
    console.log(chalk.gray(`  路由模式: ${chalk.white(config.routeMode)}`))
    console.log(chalk.gray(`  国际化: ${chalk.white(config.i18n ? '是' : '否')}`))
    console.log(chalk.gray(`  错误监控: ${chalk.white(config.sentry ? '是' : '否')}`))
    console.log(chalk.gray(`  包管理器: ${chalk.white(config.packageManager)}`))
    console.log('')

    // 创建项目
    const spinner = ora('正在创建项目...').start()
    try {
      await generateProject(config)
      spinner.succeed('项目创建成功!')
    }
    catch (error) {
      spinner.fail('项目创建失败')
      throw error
    }

    // 初始化 Git
    const gitSpinner = ora('正在初始化 Git...').start()
    try {
      await initGit(config.targetDir, config.projectName)
      gitSpinner.succeed('Git 初始化成功!')
    }
    catch {
      gitSpinner.warn('Git 初始化跳过')
    }

    // 安装依赖
    console.log(chalk.blue('\n📦 开始安装依赖...\n'))
    try {
      await installDependencies(config.packageManager, config.targetDir, 1)
      console.log(chalk.green('\n✅ 依赖安装成功!\n'))
    }
    catch (error) {
      console.log(chalk.red('\n❌ 依赖安装失败\n'))
      console.log(
        chalk.yellow('⚠️  项目已创建，但依赖安装失败。'),
      )
      console.log(
        chalk.yellow(`   请手动运行 "${config.packageManager} install"\n`),
      )
      if (error instanceof Error) {
        console.log(chalk.gray(`   错误详情: ${error.message}`))
      }
    }

    // 显示成功信息
    console.log(chalk.green.bold('\n✅ 项目创建成功!\n'))
    console.log(chalk.blue('下一步:'))
    console.log(chalk.gray(`  cd ${config.projectName}`))
    console.log(chalk.gray(`  ${config.packageManager} dev\n`))

    // 显示透明内置能力与可选外部依赖
    console.log(chalk.blue('内置透明源码:'))
    console.log(chalk.gray('  src/apis/ajax（Axios 请求封装）'))
    if (config.eslint) {
      console.log(chalk.blue('已启用的 @moluoxixi 依赖:'))
      console.log(chalk.gray(`  @moluoxixi/eslint-config@${MOLUOXIXI_DEPS['@moluoxixi/eslint-config']}`))
    }
    console.log('')
  }
  catch (error) {
    console.error(chalk.red('\n❌ 错误:'), error)
    process.exit(1)
  }
}
