/**
 * Vue 项目生成器
 * 生成 Vue 3 项目结构
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
 * 生成 Vue 项目
 * @param config 项目配置
 */
export async function generateVueProject(config: ProjectConfig): Promise<void> {
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

  // Vue 框架特定配置文件（根目录）
  const vueRootConfigFiles = [
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

  // 批量生成 Vue 框架特定配置文件
  generateFiles(config, targetDir, 'vue', vueRootConfigFiles)

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
    'directives',
    'layouts',
    'locales/lang',
    'router',
    'stores/modules',
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
  generateLocaleFiles(config, targetDir, 'vue')
  generateUtilsFiles(config, targetDir, 'vue')
  generatePagesFiles(config)
  generateAssetsFiles(config)
  generateConstantsFiles(config, targetDir)
  generateDirectivesFiles(config)
  generateComponentsFiles(config)
}

/**
 * 生成主要文件
 * @param config 项目配置
 */
function generateMainFiles(config: ProjectConfig): void {
  const { targetDir } = config

  // main.ts
  copyAndRenderTemplate(
    'vue/src/main.ts.ejs',
    join(targetDir, 'src/main.ts'),
    config,
  )

  // App.vue
  copyAndRenderTemplate(
    'vue/src/App.vue.ejs',
    join(targetDir, 'src/App.vue'),
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
      'vue/src/router/index.pages.ts.ejs',
      join(targetDir, 'src/router/index.ts'),
      config,
    )
  }
  else {
    // 手动路由模式
    copyAndRenderTemplate(
      'vue/src/router/index.manual.ts.ejs',
      join(targetDir, 'src/router/index.ts'),
      config,
    )
    copyAndRenderTemplate(
      'vue/src/router/routes.ts.ejs',
      join(targetDir, 'src/router/routes.ts'),
      config,
    )
  }

  // layout.vue
  copyAndRenderTemplate(
    'vue/src/router/layout.vue.ejs',
    join(targetDir, 'src/router/layout.vue'),
    config,
  )
}

/**
 * 生成状态管理文件
 * @param config 项目配置
 */
function generateStoreFiles(config: ProjectConfig): void {
  const { targetDir } = config

  // stores/index.ts
  copyAndRenderTemplate(
    'vue/src/stores/index.ts.ejs',
    join(targetDir, 'src/stores/index.ts'),
    config,
  )

  // stores/modules/system.ts
  copyAndRenderTemplate(
    'vue/src/stores/modules/system.ts.ejs',
    join(targetDir, 'src/stores/modules/system.ts'),
    config,
  )

  // stores/modules/user.ts
  copyAndRenderTemplate(
    'vue/src/stores/modules/user.ts.ejs',
    join(targetDir, 'src/stores/modules/user.ts'),
    config,
  )
}

/**
 * 生成布局文件
 * @param config 项目配置
 */
function generateLayoutFiles(config: ProjectConfig): void {
  const { targetDir } = config

  // layouts/index.ts
  copyAndRenderTemplate(
    'vue/src/layouts/index.ts.ejs',
    join(targetDir, 'src/layouts/index.ts'),
    config,
  )

  // layouts/element.vue 或 layouts/AntDesign.vue
  const layoutFile = config.uiLibrary === 'element-plus'
    ? 'element.vue'
    : 'AntDesign.vue'

  copyAndRenderTemplate(
    `vue/src/layouts/${layoutFile}.ejs`,
    join(targetDir, `src/layouts/${layoutFile}`),
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
    'vue/src/pages/home/index.vue.ejs',
    join(targetDir, 'src/pages/home/index.vue'),
    config,
  )

  // 示例页面：about
  copyAndRenderTemplate(
    'vue/src/pages/about/index.vue.ejs',
    join(targetDir, 'src/pages/about/index.vue'),
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
    'vue/src/assets/styles/main.scss.ejs',
    join(targetDir, 'src/assets/styles/main.scss'),
    config,
  )

  // Element Plus 样式（仅当使用 element-plus 时）
  if (config.uiLibrary === 'element-plus') {
    copyAndRenderTemplate(
      'vue/src/assets/styles/element/index.scss.ejs',
      join(targetDir, 'src/assets/styles/element/index.scss'),
      config,
    )
  }
}

/**
 * 生成指令文件
 * @param config 项目配置
 */
function generateDirectivesFiles(config: ProjectConfig): void {
  const { targetDir } = config

  copyAndRenderTemplate(
    'vue/src/directives/index.ts.ejs',
    join(targetDir, 'src/directives/index.ts'),
    config,
  )
}

/**
 * 生成组件文件
 * @param config 项目配置
 */
function generateComponentsFiles(config: ProjectConfig): void {
  const { targetDir } = config

  // SubMenu 组件（仅当使用 element-plus 时）
  if (config.uiLibrary === 'element-plus') {
    // 组件入口
    copyAndRenderTemplate(
      'vue/src/components/SubMenu/index.ts.ejs',
      join(targetDir, 'src/components/SubMenu/index.ts'),
      config,
    )
    // 组件主文件
    copyAndRenderTemplate(
      'vue/src/components/SubMenu/src/index.vue.ejs',
      join(targetDir, 'src/components/SubMenu/src/index.vue'),
      config,
    )
    // 类型定义
    copyAndRenderTemplate(
      'vue/src/components/SubMenu/src/_types/index.ts.ejs',
      join(targetDir, 'src/components/SubMenu/src/_types/index.ts'),
      config,
    )
    copyAndRenderTemplate(
      'vue/src/components/SubMenu/src/_types/props.ts.ejs',
      join(targetDir, 'src/components/SubMenu/src/_types/props.ts'),
      config,
    )
  }
}
