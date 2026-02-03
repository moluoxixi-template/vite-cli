/**
 * React 项目生成器
 * 生成 React 项目结构
 */

import type { ProjectConfig } from '../types'
import { join } from 'node:path'
import { copyAndRenderTemplate } from '../utils/file'
import {
  createSrcDirs,
  generateApisStructure,
  generateCommonAssetsFiles,
  generateCommonConfigFiles,
  generateConstantsFiles,
  generateEnvFile,
  generateFiles,
  generateHuskyFiles,
  generateLocaleFiles,
  generateScriptsFiles,
  generateUtilsFiles,
} from './common'

/**
 * 生成 React 项目
 * @param config 项目配置
 */
export async function generateReactProject(config: ProjectConfig): Promise<void> {
  // 生成基础配置文件
  generateConfigFiles(config)

  // 生成源代码目录结构
  generateSrcStructure(config)

  // 生成 apis 目录（使用公共函数）
  generateApisStructure(config, config.targetDir)
}

/**
 * 生成配置文件
 * @param config 项目配置
 */
function generateConfigFiles(config: ProjectConfig): void {
  const { targetDir } = config

  // React 框架特定配置文件（根目录）
  const reactRootConfigFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.base.json',
    'tsconfig.node.json',
    'env.d.ts',
    'index.html',
    'pnpm-workspace.yaml',
    'eslint.config.ts',
  ]

  // 批量生成 React 框架特定配置文件
  generateFiles(config, targetDir, 'react', reactRootConfigFiles)

  // 公共配置文件（使用公共函数）
  generateCommonConfigFiles(config, targetDir)

  // .env 文件（使用公共函数）
  generateEnvFile(config, targetDir)

  // husky 配置文件
  generateHuskyFiles(config, targetDir)

  // scripts 目录文件
  generateScriptsFiles(config, targetDir)
}

/**
 * 生成源代码目录结构
 * @param config 项目配置
 */
function generateSrcStructure(config: ProjectConfig): void {
  const { targetDir } = config
  const srcDir = join(targetDir, 'src')

  // 创建主要目录（使用公共函数）
  const dirs = [
    'assets/styles',
    'assets/fonts',
    'components',
    'constants',
    'layouts',
    'locales/lang',
    'router',
    'stores',
    'utils/modules',
    'pages',
    'apis/types',
    'apis/services',
  ]
  createSrcDirs(srcDir, dirs)

  // 生成主要文件
  generateMainFiles(config)
  generateRouterFiles(config)
  generateStoreFiles(config)
  generateLayoutFiles(config)
  generateLocaleFiles(config, targetDir, 'react')
  generateUtilsFiles(config, targetDir, 'react')
  generatePagesFiles(config)
  generateAssetsFiles(config)
  generateConstantsFiles(config, targetDir)
}

/**
 * 生成主要文件
 * @param config 项目配置
 */
function generateMainFiles(config: ProjectConfig): void {
  const { targetDir } = config

  // main.tsx
  copyAndRenderTemplate(
    'react/src/main.tsx.ejs',
    join(targetDir, 'src/main.tsx'),
    config,
  )

  // App.tsx
  copyAndRenderTemplate(
    'react/src/App.tsx.ejs',
    join(targetDir, 'src/App.tsx'),
    config,
  )
}

/**
 * 生成路由文件
 * @param config 项目配置
 */
function generateRouterFiles(config: ProjectConfig): void {
  const { targetDir } = config

  if (config.routeMode === 'file-system') {
    // 文件系统路由模式
    copyAndRenderTemplate(
      'react/src/router/index.pages.tsx.ejs',
      join(targetDir, 'src/router/index.tsx'),
      config,
    )
  }
  else {
    // 手动路由模式
    copyAndRenderTemplate(
      'react/src/router/index.manual.tsx.ejs',
      join(targetDir, 'src/router/index.tsx'),
      config,
    )
    copyAndRenderTemplate(
      'react/src/router/routes.tsx.ejs',
      join(targetDir, 'src/router/routes.tsx'),
      config,
    )
  }
}

/**
 * 生成状态管理文件
 * @param config 项目配置
 */
function generateStoreFiles(config: ProjectConfig): void {
  const { targetDir } = config

  // stores/user.ts
  copyAndRenderTemplate(
    'react/src/stores/user.ts.ejs',
    join(targetDir, 'src/stores/user.ts'),
    config,
  )
}

/**
 * 生成布局文件
 * @param config 项目配置
 */
function generateLayoutFiles(config: ProjectConfig): void {
  const { targetDir } = config

  // layouts/index.tsx
  copyAndRenderTemplate(
    'react/src/layouts/index.tsx.ejs',
    join(targetDir, 'src/layouts/index.tsx'),
    config,
  )
}

/**
 * 生成页面文件
 * @param config 项目配置
 */
function generatePagesFiles(config: ProjectConfig): void {
  const { targetDir } = config

  // 示例页面：home
  copyAndRenderTemplate(
    'react/src/pages/home/index.tsx.ejs',
    join(targetDir, 'src/pages/home/index.tsx'),
    config,
  )

  // 示例页面：about
  copyAndRenderTemplate(
    'react/src/pages/about/index.tsx.ejs',
    join(targetDir, 'src/pages/about/index.tsx'),
    config,
  )
}

/**
 * 生成静态资源文件
 * @param config 项目配置
 */
function generateAssetsFiles(config: ProjectConfig): void {
  const { targetDir } = config

  // 公共样式文件
  generateCommonAssetsFiles(config, targetDir)

  // main.scss（框架特定）
  copyAndRenderTemplate(
    'react/src/assets/styles/main.scss.ejs',
    join(targetDir, 'src/assets/styles/main.scss'),
    config,
  )
}
