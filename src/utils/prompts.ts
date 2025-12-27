/**
 * 交互式问答工具
 * 收集用户的项目配置信息（对标 create-vue）
 */

import type {
  FrameworkType,
  PackageManagerType,
  ProjectConfigType,
  RouteModeType,
  UILibraryType,
} from '../types'

import process from 'node:process'

import inquirer from 'inquirer'

/**
 * 收集项目配置信息
 * @param projectName 项目名称（可选）
 */
export async function collectProjectConfig(
  projectName?: string,
): Promise<ProjectConfigType> {
  const answers = await inquirer.prompt([
    // 项目名称
    {
      type: 'input',
      name: 'projectName',
      message: '项目名称:',
      default: projectName || 'my-project',
      validate: (input: string) => {
        if (!input.trim()) {
          return '项目名称不能为空'
        }
        if (!/^[\w-]+$/.test(input)) {
          return '项目名称只能包含字母、数字、连字符和下划线'
        }
        return true
      },
    },
    // 项目描述
    {
      type: 'input',
      name: 'description',
      message: '项目描述:',
      default: 'A Vite project',
    },
    // 作者
    {
      type: 'input',
      name: 'author',
      message: '作者:',
      default: '',
    },
    // 框架选择
    {
      type: 'list',
      name: 'framework',
      message: '选择框架:',
      choices: [
        { name: 'Vue 3', value: 'vue' },
        { name: 'React', value: 'react' },
      ],
    },
    // UI 库选择
    {
      type: 'list',
      name: 'uiLibrary',
      message: '选择 UI 组件库:',
      choices: (answers: Record<string, unknown>) => {
        if (answers.framework === 'vue') {
          return [
            { name: 'Element Plus', value: 'element-plus' },
            { name: 'Ant Design Vue', value: 'ant-design-vue' },
          ]
        }
        else {
          return [{ name: 'Ant Design', value: 'ant-design' }]
        }
      },
    },
    // 路由模式
    {
      type: 'list',
      name: 'routeMode',
      message: '选择路由模式:',
      choices: [
        { name: '文件系统路由 (vite-plugin-pages)', value: 'file-system' },
        { name: '手动配置路由', value: 'manual' },
      ],
    },
    // 是否启用路由
    {
      type: 'confirm',
      name: 'router',
      message: '是否启用路由 (vue-router/react-router-dom)?',
      default: true,
    },
    // 是否启用状态管理
    {
      type: 'confirm',
      name: 'stateManagement',
      message: (answers: Record<string, unknown>) => {
        return answers.framework === 'vue'
          ? '是否启用状态管理 (Pinia)?'
          : '是否启用状态管理 (Zustand)?'
      },
      default: true,
    },
    // 是否启用国际化
    {
      type: 'confirm',
      name: 'i18n',
      message: '是否启用国际化 (i18n)?',
      default: true,
    },
    // 是否启用微前端
    {
      type: 'confirm',
      name: 'qiankun',
      message: '是否启用微前端 (qiankun)?',
      default: false,
    },
    // 是否启用错误监控
    {
      type: 'confirm',
      name: 'sentry',
      message: '是否启用错误监控 (Sentry)?',
      default: false,
    },
    // 是否启用 ESLint
    {
      type: 'confirm',
      name: 'eslint',
      message: '是否启用 ESLint 代码规范检查?',
      default: true,
    },
    // 是否启用 Git Hooks
    {
      type: 'confirm',
      name: 'gitHooks',
      message: '是否启用 Git Hooks (husky + commitlint)?',
      default: true,
    },
    // 包管理器 - 仅提供 pnpm
    // {
    //   type: 'list',
    //   name: 'packageManager',
    //   message: '选择包管理器:',
    //   choices: [
    //     { name: 'pnpm (推荐)', value: 'pnpm' },
    //     { name: 'npm', value: 'npm' },
    //     { name: 'yarn', value: 'yarn' },
    //   ],
    //   default: 'pnpm',
    // },
  ])

  const targetDir = `${process.cwd()}/${answers.projectName}`

  return {
    projectName: answers.projectName,
    description: answers.description,
    author: answers.author,
    framework: answers.framework as FrameworkType,
    uiLibrary: answers.uiLibrary as UILibraryType,
    routeMode: answers.routeMode as RouteModeType,
    router: answers.router,
    stateManagement: answers.stateManagement,
    i18n: answers.i18n,
    qiankun: answers.qiankun,
    sentry: answers.sentry,
    eslint: answers.eslint,
    gitHooks: answers.gitHooks,
    // 包管理器固定为 pnpm
    packageManager: 'pnpm' as PackageManagerType,
    // packageManager: answers.packageManager as PackageManagerType,
    targetDir,
  }
}

/**
 * 确认覆盖目录
 * @param dirPath 目录路径
 */
export async function confirmOverwrite(dirPath: string): Promise<boolean> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `目录 ${dirPath} 已存在，是否覆盖?`,
      default: false,
    },
  ])

  return confirm
}
