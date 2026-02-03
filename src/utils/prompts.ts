/**
 * 交互式问答工具
 * 收集用户的项目配置信息
 */

import type { Framework, PackageManager, ProjectConfig, RouteMode, UILibrary } from '../types'
import process from 'node:process'
import inquirer from 'inquirer'

/**
 * 收集项目配置信息
 * @param projectName 项目名称（可选）
 * @returns 项目配置对象
 */
export async function collectProjectConfig(
  projectName?: string,
): Promise<ProjectConfig> {
  const answers = await inquirer.prompt([
    // 项目名称
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: projectName || 'my-project',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Project name cannot be empty'
        }
        // 验证项目名称格式（只允许字母、数字、连字符、下划线）
        if (!/^[\w-]+$/.test(input)) {
          return 'Project name can only contain letters, numbers, hyphens and underscores'
        }
        return true
      },
    },
    // 项目描述
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: 'A Vite project',
    },
    // 作者
    {
      type: 'input',
      name: 'author',
      message: 'Author:',
      default: '',
    },
    // 框架选择
    {
      type: 'list',
      name: 'framework',
      message: 'Select framework:',
      choices: [
        { name: 'Vue 3', value: 'vue' },
        { name: 'React', value: 'react' },
      ],
    },
    // UI 库选择（根据框架动态显示）
    {
      type: 'list',
      name: 'uiLibrary',
      message: 'Select UI library:',
      choices: (answers: any) => {
        if (answers.framework === 'vue') {
          return [
            { name: 'Element Plus', value: 'element-plus' },
            { name: 'Ant Design Vue', value: 'ant-design-vue' },
          ]
        }
        else {
          return [
            { name: 'Ant Design', value: 'ant-design' },
          ]
        }
      },
    },
    // 路由模式选择
    {
      type: 'list',
      name: 'routeMode',
      message: 'Select route mode:',
      choices: [
        {
          name: 'File System Routes (vite-plugin-pages)',
          value: 'file-system',
        },
        {
          name: 'Manual Routes',
          value: 'manual',
        },
      ],
    },
    // 是否启用国际化
    {
      type: 'confirm',
      name: 'i18n',
      message: 'Enable i18n (internationalization)?',
      default: true,
    },
    // 是否启用微前端支持
    {
      type: 'confirm',
      name: 'qiankun',
      message: 'Enable qiankun (micro-frontend)?',
      default: false,
    },
    // 是否启用错误监控
    {
      type: 'confirm',
      name: 'sentry',
      message: 'Enable Sentry (error monitoring)?',
      default: false,
    },
    // 包管理器选择
    {
      type: 'list',
      name: 'packageManager',
      message: 'Select package manager:',
      choices: [
        { name: 'pnpm', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
      ],
      default: 'pnpm',
    },
  ])

  // 构建目标目录路径
  const targetDir = `${process.cwd()}/${answers.projectName}`

  return {
    projectName: answers.projectName,
    description: answers.description,
    author: answers.author,
    framework: answers.framework as Framework,
    uiLibrary: answers.uiLibrary as UILibrary,
    routeMode: answers.routeMode as RouteMode,
    i18n: answers.i18n,
    qiankun: answers.qiankun,
    sentry: answers.sentry,
    packageManager: answers.packageManager as PackageManager,
    targetDir,
  }
}
