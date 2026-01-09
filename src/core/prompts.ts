/**
 * 交互式问答模块
 * 收集用户的项目配置信息（对标 create-vue）
 */

import type {
  FrameworkType,
  MicroFrontendEngine,
  PackageManagerType,
  ProjectConfigType,
  RouteModeType,
  UILibraryType,
} from '../types/index.ts'

import fs from 'node:fs'
import process from 'node:process'

import inquirer from 'inquirer'

import {
  FRAMEWORK_OPTIONS,
  MICRO_FRONTEND_ENGINE_OPTIONS,
  PACKAGE_MANAGER_OPTIONS,
  ROUTE_MODE_OPTIONS,
  UI_LIBRARY_OPTIONS,
} from '../constants/index.ts'
import { getDefaultAuthor } from '../utils/npmConfig.ts'
import { getRouteModeFeatures } from './feature.ts'

/**
 * 收集项目配置信息
 * @param projectName 项目名称（可选）
 * @returns 项目配置对象
 */
export async function collectProjectConfig(
  projectName?: string,
): Promise<ProjectConfigType> {
  // 获取默认作者信息
  const defaultAuthor = getDefaultAuthor()

  const answers = await inquirer.prompt([
    // 项目名称
    {
      type: 'input',
      name: 'projectName',
      message: '项目名称:',
      default: projectName || 'my-project',
      validate: (input: string) => {
        const trimmed = input.trim()
        if (!trimmed) {
          return '项目名称不能为空'
        }
        const minLength = 1
        const maxLength = 214
        if (trimmed.length < minLength || trimmed.length > maxLength) {
          return `项目名称长度必须在 ${minLength}-${maxLength} 个字符之间`
        }
        if (!/^[\w-]+$/.test(trimmed)) {
          return '项目名称只能包含字母、数字、连字符和下划线'
        }
        const reservedNames = [
          'node',
          'npm',
          'test',
          'lib',
          'api',
          'www',
          'admin',
          'root',
          'config',
          'build',
          'dist',
          'src',
          'public',
          'private',
        ]
        if (reservedNames.includes(trimmed.toLowerCase())) {
          return `项目名称不能使用保留名称: ${trimmed}`
        }
        // 检查目标目录是否已存在且不为空
        const targetDir = `${process.cwd()}/${trimmed}`
        if (fs.existsSync(targetDir)) {
          try {
            const stats = fs.statSync(targetDir)
            if (stats.isDirectory()) {
              const files = fs.readdirSync(targetDir)
              if (files.length > 0) {
                return `目录 ${targetDir} 已存在且不为空，请选择其他名称或先清空该目录`
              }
            }
          }
          catch {
            // 忽略检查错误，让后续流程处理
          }
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
      default: defaultAuthor,
    },
    // 框架选择
    {
      type: 'list',
      name: 'framework',
      message: '选择框架:',
      choices: FRAMEWORK_OPTIONS,
    },
    // UI 库选择
    {
      type: 'list',
      name: 'uiLibrary',
      message: '选择 UI 组件库:',
      choices: (answers: Record<string, unknown>) => {
        const framework = answers.framework as FrameworkType
        return UI_LIBRARY_OPTIONS[framework] ?? []
      },
    },
    // 路由模式（路由已内置，只需选择模式）
    {
      type: 'list',
      name: 'routeMode',
      message: '选择路由模式:',
      choices: ROUTE_MODE_OPTIONS,
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
      name: 'microFrontend',
      message: '是否启用微前端支持?',
      default: false,
    },
    // 微前端引擎选择
    {
      type: 'list',
      name: 'microFrontendEngine',
      message: '选择微前端引擎:',
      choices: MICRO_FRONTEND_ENGINE_OPTIONS,
      when: (answers: Record<string, unknown>) => answers.microFrontend === true,
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
    // 包管理器选择
    {
      type: 'list',
      name: 'packageManager',
      message: '选择包管理器:',
      choices: PACKAGE_MANAGER_OPTIONS,
      default: 'pnpm',
    },
  ])

  const targetDir = `${process.cwd()}/${answers.projectName}`

  // 根据框架确定状态管理 feature
  const isPinia = answers.framework === 'vue'
  const isZustand = answers.framework === 'react'

  // 根据路由模式获取对应的布尔特征配置
  const routeMode = answers.routeMode as RouteModeType
  const routeModeFeatures = getRouteModeFeatures(routeMode)

  return {
    projectName: answers.projectName,
    description: answers.description,
    author: answers.author,
    framework: answers.framework as FrameworkType,
    uiLibrary: answers.uiLibrary as UILibraryType,
    routeMode,
    // feature 名称与目录名称一致
    pinia: isPinia,
    zustand: isZustand,
    manualRoutes: routeModeFeatures.manualRoutes,
    pageRoutes: routeModeFeatures.pageRoutes,
    i18n: answers.i18n,
    microFrontend: answers.microFrontend || false,
    microFrontendEngine: answers.microFrontendEngine as MicroFrontendEngine | undefined,
    sentry: answers.sentry,
    eslint: answers.eslint,
    husky: answers.gitHooks,
    packageManager: answers.packageManager as PackageManagerType,
    targetDir,
  }
}

/**
 * 确认覆盖目录
 * @param dirPath 目录路径
 * @returns 是否确认覆盖
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
