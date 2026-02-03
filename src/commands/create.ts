/**
 * Create 命令
 * 创建新项目的核心逻辑
 */

import process from 'node:process'
import chalk from 'chalk'
import ora from 'ora'
import { generateProject } from '../generators/project'
import { pathExists } from '../utils/file'
import { installDependencies } from '../utils/install'
import { collectProjectConfig } from '../utils/prompts'

/**
 * 创建项目
 * @param projectName 项目名称（可选）
 */
export async function createProject(projectName?: string): Promise<void> {
  try {
    // 显示欢迎信息
    console.log(chalk.blue.bold('\n🚀 Welcome to Vite Template CLI!\n'))

    // 收集项目配置
    const config = await collectProjectConfig(projectName)

    // 检查目标目录是否已存在
    if (pathExists(config.targetDir)) {
      console.log(
        chalk.red(
          `\n❌ Directory ${config.targetDir} already exists!\n`,
        ),
      )
      process.exit(1)
    }

    // 显示配置摘要
    console.log(chalk.green('\n📋 Project Configuration:'))
    console.log(chalk.gray(`  Framework: ${chalk.white(config.framework)}`))
    console.log(chalk.gray(`  UI Library: ${chalk.white(config.uiLibrary)}`))
    console.log(chalk.gray(`  Route Mode: ${chalk.white(config.routeMode)}`))
    console.log(chalk.gray(`  i18n: ${chalk.white(config.i18n ? 'Yes' : 'No')}`))
    console.log(chalk.gray(`  Qiankun: ${chalk.white(config.qiankun ? 'Yes' : 'No')}`))
    console.log(chalk.gray(`  Sentry: ${chalk.white(config.sentry ? 'Yes' : 'No')}`))
    console.log(chalk.gray(`  Package Manager: ${chalk.white(config.packageManager)}`))
    console.log('')

    // 创建项目
    const spinner = ora('Creating project...').start()
    try {
      await generateProject(config)
      spinner.succeed('Project created successfully!')
    }
    catch (error) {
      spinner.fail('Failed to create project')
      throw error
    }

    // 安装依赖
    const installSpinner = ora('Installing dependencies...').start()
    try {
      installDependencies(config.packageManager, config.targetDir)
      installSpinner.succeed('Dependencies installed successfully!')
    }
    catch {
      installSpinner.fail('Failed to install dependencies')
      // 依赖安装失败不影响项目创建，只提示用户
      console.log(
        chalk.yellow(
          '\n⚠️  Project created, but dependencies installation failed.',
        ),
      )
      console.log(
        chalk.yellow(
          `   Please run "${config.packageManager} install" manually in ${config.targetDir}`,
        ),
      )
    }

    // 显示成功信息
    console.log(chalk.green.bold('\n✅ Project created successfully!\n'))
    console.log(chalk.blue('Next steps:'))
    console.log(chalk.gray(`  cd ${config.projectName}`))
    console.log(chalk.gray(`  ${config.packageManager} dev\n`))
  }
  catch (error) {
    console.error(chalk.red('\n❌ Error:'), error)
    process.exit(1)
  }
}
