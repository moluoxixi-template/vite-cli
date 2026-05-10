/**
 * 生成项目输出整理模块
 * 在模板叠加完成后读取各模板 atom.mjs，把贡献合成为普通 Vite 项目文件。
 */

import type { ProjectOutputComposition } from './projectAtom.ts'
import type { PackageJson } from '../types/packageJson.ts'
import type { ProjectConfigType } from '../types/index.ts'

import fs from 'fs-extra'
import path from 'node:path'

import {
  composeProjectOutput,
  loadProjectAtoms,
} from './projectAtom.ts'
import {
  getCommonFeatures,
  getFrameworkFeatures,
} from './feature.ts'
import { getTemplatesDir } from '../utils/file.ts'

const REMOVED_VITE_BLACK_BOX_DEPS = [
  '@moluoxixi/vite-config',
  '@moluoxixi/css-module-global-root-plugin',
  'jiti',
]

/**
 * 完成生成项目的最终输出整理。
 * @param config 项目配置
 * @throws {Error} 如果最终文件写入、atom 读取或 package.json 清理失败
 */
export async function finalizeProjectOutput(config: ProjectConfigType): Promise<void> {
  removeRuntimeLoaderDirs(config.targetDir)
  const atomDirs = collectProjectAtomDirs(config)
  const atoms = await loadProjectAtoms(atomDirs)
  const output = composeProjectOutput(atoms)

  writeMainEntry(config, output)
  writeViteConfig(config, output)
  removeViteBlackBoxDependencies(config.targetDir)
}

/**
 * 移除只属于脚手架组合阶段的运行时 loader 目录。
 * @param targetDir 生成项目根目录
 */
function removeRuntimeLoaderDirs(targetDir: string): void {
  fs.removeSync(path.join(targetDir, 'src', 'main'))
  fs.removeSync(path.join(targetDir, 'vite'))
}

/**
 * 收集当前项目配置启用的模板 atom 目录。
 * @param config 项目配置
 * @returns 按模板叠加顺序排列的目录
 */
function collectProjectAtomDirs(config: ProjectConfigType): string[] {
  const templatesDir = getTemplatesDir()
  const atomDirs = [
    path.join(templatesDir, 'common', 'base'),
    path.join(templatesDir, config.framework, 'base'),
  ]

  atomDirs.push(...collectCommonFeatureAtomDirs(config, templatesDir))
  atomDirs.push(...collectFrameworkFeatureAtomDirs(config, templatesDir))

  if (config.microFrontend && config.microFrontendEngine) {
    atomDirs.push(path.join(
      templatesDir,
      config.framework,
      'micro-frontends',
      config.microFrontendEngine,
      'base',
    ))
  }

  atomDirs.push(...collectMicroFrontendFeatureAtomDirs(config, templatesDir))

  return atomDirs
}

/**
 * 收集公共 feature 的 atom 目录。
 * @param config 项目配置
 * @param templatesDir 模板根目录
 * @returns 启用的公共 feature 目录
 */
function collectCommonFeatureAtomDirs(config: ProjectConfigType, templatesDir: string): string[] {
  const availableFeatures = getCommonFeatures()
  const featureDirs: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (value === true && availableFeatures.includes(key)) {
      featureDirs.push(path.join(templatesDir, 'common', 'features', key))
    }
  }

  return featureDirs
}

/**
 * 收集框架 feature 的 atom 目录。
 * @param config 项目配置
 * @param templatesDir 模板根目录
 * @returns 启用的框架 feature 目录
 */
function collectFrameworkFeatureAtomDirs(config: ProjectConfigType, templatesDir: string): string[] {
  const availableFeatures = getFrameworkFeatures(config.framework)
  const featureDirs: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (value === true && availableFeatures.includes(key)) {
      featureDirs.push(path.join(templatesDir, config.framework, 'features', key))
    }
  }

  if (config.uiLibrary && availableFeatures.includes(config.uiLibrary)) {
    featureDirs.push(path.join(templatesDir, config.framework, 'features', config.uiLibrary))
  }

  return featureDirs
}

/**
 * 收集微前端 feature 的 atom 目录。
 * @param config 项目配置
 * @param templatesDir 模板根目录
 * @returns 启用的微前端 feature 目录
 */
function collectMicroFrontendFeatureAtomDirs(config: ProjectConfigType, templatesDir: string): string[] {
  if (!config.microFrontend || !config.microFrontendEngine) {
    return []
  }

  const microFrontendFeaturesPath = path.join(
    templatesDir,
    config.framework,
    'micro-frontends',
    config.microFrontendEngine,
    'features',
  )
  if (!fs.existsSync(microFrontendFeaturesPath)) {
    return []
  }

  const availableFeatures = fs.readdirSync(microFrontendFeaturesPath).filter((item) => {
    const itemPath = path.join(microFrontendFeaturesPath, item)
    return fs.statSync(itemPath).isDirectory()
  })
  const featureDirs: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (value === true && availableFeatures.includes(key)) {
      featureDirs.push(path.join(microFrontendFeaturesPath, key))
    }
  }

  if (config.uiLibrary && availableFeatures.includes(config.uiLibrary)) {
    featureDirs.push(path.join(microFrontendFeaturesPath, config.uiLibrary))
  }

  return featureDirs
}

/**
 * 写入框架对应的最终入口文件。
 * @param config 项目配置
 * @param output atom 合并后的输出模型
 * @throws {Error} 如果框架或入口模式不受支持
 */
function writeMainEntry(config: ProjectConfigType, output: ProjectOutputComposition): void {
  if (config.framework !== 'vue') {
    throw new Error(`不支持的框架: ${config.framework}`)
  }

  const mainEntryPath = path.join(config.targetDir, 'src', 'main.ts')
  const content = createVueMainEntry(output)

  fs.ensureDirSync(path.dirname(mainEntryPath))
  fs.writeFileSync(mainEntryPath, content)
}

/**
 * 生成 Vue 项目的最终入口文件内容。
 * @param output atom 合并后的输出模型
 * @returns main.ts 文件内容
 * @throws {Error} 如果入口模式不受支持
 */
function createVueMainEntry(output: ProjectOutputComposition): string {
  if (output.main.mode === 'vue-standard') {
    return createVueStandardMainEntry(output)
  }
  if (output.main.mode === 'vue-qiankun') {
    return createVueQiankunMainEntry(output)
  }

  throw new Error(`不支持的 Vue 入口模式: ${output.main.mode as string}`)
}

/**
 * 生成普通 Vue 项目的入口文件内容。
 * @param output atom 合并后的输出模型
 * @returns main.ts 文件内容
 */
function createVueStandardMainEntry(output: ProjectOutputComposition): string {
  return `${createMainImports(output, 'Vue 应用入口文件')}

/**
 * 初始化并挂载 Vue 应用。
 */
function bootstrap(): void {
  const app = createApp(App)
  const router = getRouter()

${createVueAppSetup(output)}

  app.mount('#app')
}

bootstrap()
`
}

/**
 * 生成 Vue + Qiankun 项目的入口文件内容。
 * @param output atom 合并后的输出模型
 * @returns main.ts 文件内容
 */
function createVueQiankunMainEntry(output: ProjectOutputComposition): string {
  return `${createMainImports(output, 'Vue 微前端应用入口文件')}

let app: ReturnType<typeof createApp> | null = null

/**
 * 解析 Vue 应用挂载节点，避免 qiankun 容器缺失时静默失败。
 * @param container qiankun 传入的容器节点
 * @returns Vue 可挂载的目标节点或选择器
 * @throws {Error} 当 qiankun 容器内不存在 #app 节点
 */
function resolveMountTarget(container?: Element): Element | string {
  if (!container) {
    return '#app'
  }

  const target = container.querySelector('#app')
  if (!target) {
    throw new Error('Qiankun container missing #app mount target')
  }
  return target
}

/**
 * 渲染 Vue 应用，独立运行和 qiankun 挂载共用同一流程。
 * @param props qiankun 传入的生命周期属性
 */
function render(props: Record<string, unknown> = {}): void {
  const { container } = props as { container?: Element }
  app = createApp(App)
  const router = getRouter(props)

${createVueAppSetup(output)}

  app.mount(resolveMountTarget(container))
}

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render({})
}
else {
  renderWithQiankun({
    mount(props: Record<string, unknown>) {
      render(props)
    },
    bootstrap() {},
    unmount() {
      app?.unmount()
      app = null
    },
    update() {},
  })
}
`
}

/**
 * 创建 main.ts 的 import 区块。
 * @param output atom 合并后的输出模型
 * @param title 入口文件标题
 * @returns import 文本
 */
function createMainImports(output: ProjectOutputComposition, title: string): string {
  return [
    '/**',
    ` * ${title}`,
    ' * 由 create-app 在生成阶段按已选能力合成。',
    ' */',
    '',
    ...output.main.imports,
  ].join('\n')
}

/**
 * 创建 Vue 应用插件安装和初始化代码。
 * @param output atom 合并后的输出模型
 * @returns 已缩进的代码块
 */
function createVueAppSetup(output: ProjectOutputComposition): string {
  const lines = [
    ...output.main.setup,
    ...output.main.appSetup,
    ...output.main.appUses,
    'app.use(router)',
    ...output.main.afterSetup,
    ...output.main.afterAppUses,
  ]

  return indentLines(lines.filter(Boolean), 2)
}

/**
 * 写入最终 Vite 配置文件。
 * @param config 项目配置
 * @param output atom 合并后的输出模型
 * @throws {Error} 如果框架不受支持
 */
function writeViteConfig(config: ProjectConfigType, output: ProjectOutputComposition): void {
  if (config.framework !== 'vue') {
    throw new Error(`不支持的框架: ${config.framework}`)
  }

  const viteConfigPath = path.join(config.targetDir, 'vite.config.ts')
  fs.writeFileSync(viteConfigPath, createVueViteConfig(output))
}

/**
 * 生成 Vue 项目的透明 Vite 配置。
 * @param output atom 合并后的输出模型
 * @returns vite.config.ts 文件内容
 */
function createVueViteConfig(output: ProjectOutputComposition): string {
  return `${createViteConfigImports(output)}

/**
 * 创建 Vue 项目的 Vite 配置。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const appCode = env.VITE_APP_CODE || ''

  const plugins: PluginOption[] = []
${indentLines(output.vite.plugins, 2)}

  return {
    base: appCode ? \`/\${appCode}\` : '/',
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      outDir: 'dist',
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_APP_PORT || 3000),
      proxy: {
        '/api': {
          changeOrigin: true,
          target: 'http://localhost:3000',
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
          api: 'modern-compiler',
${createScssOptions(output)}        },
      },
    },
  }
})
`
}

/**
 * 创建 Vite 配置的 import 区块。
 * @param output atom 合并后的输出模型
 * @returns import 文本
 */
function createViteConfigImports(output: ProjectOutputComposition): string {
  return [
    '/**',
    ' * Vite 配置文件',
    ' * 由 create-app 在生成阶段按已选能力合成。',
    ' */',
    '',
    'import process from \'node:process\'',
    'import { fileURLToPath, URL } from \'node:url\'',
    'import type { PluginOption } from \'vite\'',
    'import { defineConfig, loadEnv } from \'vite\'',
    ...output.vite.imports,
  ].join('\n')
}

/**
 * 创建 SCSS 扩展配置代码。
 * @param output atom 合并后的输出模型
 * @returns 已缩进并带结尾换行的 SCSS 配置片段
 */
function createScssOptions(output: ProjectOutputComposition): string {
  if (output.vite.scssOptions.length === 0) {
    return ''
  }

  return `${indentLines(output.vite.scssOptions, 10)}\n`
}

/**
 * 按指定空格数缩进代码行。
 * @param lines 代码行或多行代码块数组
 * @param spaces 缩进空格数
 * @returns 缩进后的代码文本
 */
function indentLines(lines: string[], spaces: number): string {
  if (lines.length === 0) {
    return ''
  }

  const prefix = ' '.repeat(spaces)
  return lines
    .flatMap(line => line.split('\n'))
    .map(line => (line ? `${prefix}${line}` : ''))
    .join('\n')
}

/**
 * 清理透明 Vite 配置不再需要的黑盒依赖。
 * @param targetDir 生成项目根目录
 * @throws {Error} 如果 package.json 读取或写入失败
 */
function removeViteBlackBoxDependencies(targetDir: string): void {
  const packageJsonPath = path.join(targetDir, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`生成项目缺少 package.json: ${packageJsonPath}`)
  }

  const packageJson = fs.readJsonSync(packageJsonPath) as PackageJson
  removeDependencies(packageJson.dependencies)
  removeDependencies(packageJson.devDependencies)
  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })
  fs.appendFileSync(packageJsonPath, '\n')
}

/**
 * 从依赖集合中删除脚手架黑盒 Vite 配置依赖。
 * @param dependencies package.json 中的依赖字段
 */
function removeDependencies(dependencies?: Record<string, string>): void {
  if (!dependencies) {
    return
  }

  for (const dependency of REMOVED_VITE_BLACK_BOX_DEPS) {
    delete dependencies[dependency]
  }
}
