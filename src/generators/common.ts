/**
 * 通用生成器函数
 * 提取 Vue 和 React 项目生成器中的公共逻辑
 */

import type { ProjectConfig } from '../types'
import { join } from 'node:path'
import { copyAndRenderTemplate, createDir } from '../utils/file.ts'

/**
 * 生成 apis 目录结构（Vue 和 React 通用）
 * @param config 项目配置
 * @param targetDir 目标目录
 */
export function generateApisStructure(
  config: ProjectConfig,
  targetDir: string,
): void {
  // apis/request.ts
  copyAndRenderTemplate(
    'common/apis/request.ts.ejs',
    join(targetDir, 'src/apis/request.ts'),
    config,
  )

  // apis/types/common.ts
  copyAndRenderTemplate(
    'common/apis/types/common.ts.ejs',
    join(targetDir, 'src/apis/types/common.ts'),
    config,
  )

  // apis/types/user.ts
  copyAndRenderTemplate(
    'common/apis/types/user.ts.ejs',
    join(targetDir, 'src/apis/types/user.ts'),
    config,
  )

  // apis/types/index.ts
  copyAndRenderTemplate(
    'common/apis/types/index.ts.ejs',
    join(targetDir, 'src/apis/types/index.ts'),
    config,
  )

  // apis/services/user.ts
  copyAndRenderTemplate(
    'common/apis/services/user.ts.ejs',
    join(targetDir, 'src/apis/services/user.ts'),
    config,
  )

  // apis/services/example.ts
  copyAndRenderTemplate(
    'common/apis/services/example.ts.ejs',
    join(targetDir, 'src/apis/services/example.ts'),
    config,
  )

  // apis/index.ts
  copyAndRenderTemplate(
    'common/apis/index.ts.ejs',
    join(targetDir, 'src/apis/index.ts'),
    config,
  )
}

/**
 * 生成国际化文件（Vue 和 React 通用）
 * @param config 项目配置
 * @param targetDir 目标目录
 * @param framework 框架类型（vue 或 react）
 */
export function generateLocaleFiles(
  config: ProjectConfig,
  targetDir: string,
  framework: 'vue' | 'react',
): void {
  if (!config.i18n) {
    return
  }

  // locales/index.ts（框架特定）
  copyAndRenderTemplate(
    `${framework}/src/locales/index.ts.ejs`,
    join(targetDir, 'src/locales/index.ts'),
    config,
  )

  // 语言文件（公共）
  const langs = ['zh', 'en', 'es']
  langs.forEach((lang) => {
    copyAndRenderTemplate(
      `common/src/locales/lang/${lang}.ts.ejs`,
      join(targetDir, `src/locales/lang/${lang}.ts`),
      config,
    )
  })
}

/**
 * 生成工具文件（Vue 和 React 通用）
 * @param config 项目配置
 * @param targetDir 目标目录
 * @param framework 框架类型（vue 或 react）
 */
export function generateUtilsFiles(
  config: ProjectConfig,
  targetDir: string,
  framework: 'vue' | 'react',
): void {
  // utils/index.ts（公共）
  copyAndRenderTemplate(
    'common/src/utils/index.ts.ejs',
    join(targetDir, 'src/utils/index.ts'),
    config,
  )

  // utils/sentry.ts（如果启用 Sentry，框架特定）
  if (config.sentry) {
    copyAndRenderTemplate(
      `${framework}/src/utils/sentry.ts.ejs`,
      join(targetDir, 'src/utils/sentry.ts'),
      config,
    )
  }
}

/**
 * 生成环境配置文件（.env, .env.development, .env.production）
 * @param config 项目配置
 * @param targetDir 目标目录
 */
export function generateEnvFile(
  config: ProjectConfig,
  targetDir: string,
): void {
  const envFiles = [
    '.env',
    '.env.development',
    '.env.production',
  ]

  generateFiles(config, targetDir, 'common', envFiles)
}

/**
 * 批量生成文件（公共方法）
 * @param config 项目配置
 * @param targetDir 目标目录
 * @param templateDir 模板目录（如 'vue', 'react', 'common'）
 * @param files 文件列表（相对于目标目录的路径）
 */
export function generateFiles(
  config: ProjectConfig,
  targetDir: string,
  templateDir: string,
  files: string[],
): void {
  files.forEach((file) => {
    copyAndRenderTemplate(
      `${templateDir}/${file}.ejs`,
      join(targetDir, file),
      config,
    )
  })
}

/**
 * 生成公共配置文件
 * @param config 项目配置
 * @param targetDir 目标目录
 */
export function generateCommonConfigFiles(
  config: ProjectConfig,
  targetDir: string,
): void {
  const commonConfigFiles = [
    '.gitignore',
    '.cz-config.cjs',
    'commitlint.config.ts',
  ]

  generateFiles(config, targetDir, 'common', commonConfigFiles)
}

/**
 * 生成公共静态资源文件
 * @param config 项目配置
 * @param targetDir 目标目录
 */
export function generateCommonAssetsFiles(
  config: ProjectConfig,
  targetDir: string,
): void {
  // 公共样式文件
  const commonStyleFiles = ['base.scss', 'custom.scss', 'tailwind.scss']
  commonStyleFiles.forEach((file) => {
    copyAndRenderTemplate(
      `common/src/assets/styles/${file}.ejs`,
      join(targetDir, `src/assets/styles/${file}`),
      config,
    )
  })

  // 字体文件
  copyAndRenderTemplate(
    'common/src/assets/fonts/index.css.ejs',
    join(targetDir, 'src/assets/fonts/index.css'),
    config,
  )
}

/**
 * 生成常量文件（公共）
 * @param config 项目配置
 * @param targetDir 目标目录
 */
export function generateConstantsFiles(
  config: ProjectConfig,
  targetDir: string,
): void {
  copyAndRenderTemplate(
    'common/src/constants/index.ts.ejs',
    join(targetDir, 'src/constants/index.ts'),
    config,
  )
}

/**
 * 创建源代码基础目录结构
 * @param srcDir src 目录路径
 * @param dirs 需要创建的目录列表
 */
export function createSrcDirs(srcDir: string, dirs: string[]): void {
  dirs.forEach((dir) => {
    createDir(join(srcDir, dir))
  })
}

/**
 * 生成 husky 配置文件
 * @param config 项目配置
 * @param targetDir 目标目录
 */
export function generateHuskyFiles(
  config: ProjectConfig,
  targetDir: string,
): void {
  // 创建 .husky 目录
  createDir(join(targetDir, '.husky'))

  // install.mjs
  copyAndRenderTemplate(
    'common/husky/install.mjs.ejs',
    join(targetDir, '.husky/install.mjs'),
    config,
  )

  // pre-commit
  copyAndRenderTemplate(
    'common/husky/pre-commit.ejs',
    join(targetDir, '.husky/pre-commit'),
    config,
  )

  // commit-msg
  copyAndRenderTemplate(
    'common/husky/commit-msg.ejs',
    join(targetDir, '.husky/commit-msg'),
    config,
  )
}

/**
 * 生成 scripts 目录文件
 * @param config 项目配置
 * @param targetDir 目标目录
 */
export function generateScriptsFiles(
  config: ProjectConfig,
  targetDir: string,
): void {
  // 创建 scripts 目录
  createDir(join(targetDir, 'scripts'))

  // build.mts
  copyAndRenderTemplate(
    'common/scripts/build.mts.ejs',
    join(targetDir, 'scripts/build.mts'),
    config,
  )
}
