/**
 * 生成项目输出整理模块
 * 在模板叠加完成后，把脚手架内部组合结果收敛为普通 Vite 项目文件。
 */

import type { PackageJson } from '../types/packageJson.ts'
import type { ProjectConfigType } from '../types/index.ts'

import fs from 'fs-extra'
import path from 'node:path'

const REMOVED_VITE_BLACK_BOX_DEPS = [
  '@moluoxixi/vite-config',
  '@moluoxixi/css-module-global-root-plugin',
  'jiti',
]

/**
 * 完成生成项目的最终输出整理。
 * @param config 项目配置
 * @throws {Error} 如果最终文件写入或 package.json 清理失败
 */
export function finalizeProjectOutput(config: ProjectConfigType): void {
  removeRuntimeLoaderDirs(config.targetDir)
  writeMainEntry(config)
  writeViteConfig(config)
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
 * 写入框架对应的最终入口文件。
 * @param config 项目配置
 * @throws {Error} 如果框架不受支持
 */
function writeMainEntry(config: ProjectConfigType): void {
  const mainEntryPath = path.join(
    config.targetDir,
    'src',
    config.framework === 'react' ? 'main.tsx' : 'main.ts',
  )

  let content: string
  if (config.framework === 'vue') {
    content = createVueMainEntry(config)
  }
  else if (config.framework === 'react') {
    content = createReactMainEntry(config)
  }
  else {
    throw new Error(`不支持的框架: ${config.framework}`)
  }

  fs.ensureDirSync(path.dirname(mainEntryPath))
  fs.writeFileSync(mainEntryPath, content)
}

/**
 * 生成 Vue 项目的最终入口文件内容。
 * @param config 项目配置
 * @returns main.ts 文件内容
 */
function createVueMainEntry(config: ProjectConfigType): string {
  if (config.microFrontend && config.microFrontendEngine === 'qiankun') {
    return createVueQiankunMainEntry(config)
  }

  const imports = [
    '/**',
    ' * Vue 应用入口文件',
    ' * 由 create-app 在生成阶段按已选能力合成。',
    ' */',
    '',
    'import { createApp } from \'vue\'',
    'import directives from \'@/directives\'',
    'import App from \'@/App.vue\'',
    'import getRouter from \'@/router\'',
  ]

  if (config.pinia) {
    imports.push('import { store } from \'@/stores\'')
  }
  if (config.i18n) {
    imports.push('import i18n from \'@/locales\'')
  }
  if (config.sentry) {
    imports.push('import { initSentry } from \'@/utils/sentry\'')
  }

  imports.push(
    '',
    'import \'@/assets/styles/main.scss\'',
    'import \'@/assets/fonts/index.css\'',
  )

  if (config.uiLibrary === 'element-plus') {
    imports.push('import \'@/assets/styles/element/index.scss\'')
  }

  const uses = [
    '  directives(app)',
  ]

  if (config.pinia) {
    uses.push('  app.use(store)')
  }
  uses.push('  app.use(router)')
  if (config.i18n) {
    uses.push('  app.use(i18n)')
  }
  if (config.sentry) {
    uses.push(
      '',
      '  initSentry(app, router, {',
      '    dsn: import.meta.env.VITE_SENTRY_DSN,',
      '    environment: import.meta.env.MODE,',
      '  })',
    )
  }

  return `${imports.join('\n')}

/**
 * 初始化并挂载 Vue 应用。
 */
function bootstrap(): void {
  const app = createApp(App)
  const router = getRouter()

${uses.join('\n')}

  app.mount('#app')
}

bootstrap()
`
}

/**
 * 生成 Vue + Qiankun 项目的最终入口文件内容。
 * @param config 项目配置
 * @returns main.ts 文件内容
 */
function createVueQiankunMainEntry(config: ProjectConfigType): string {
  const imports = [
    '/**',
    ' * Vue 微前端应用入口文件',
    ' * 由 create-app 在生成阶段按已选能力合成。',
    ' */',
    '',
    'import { qiankunWindow, renderWithQiankun } from \'vite-plugin-qiankun/dist/helper\'',
    'import { createApp } from \'vue\'',
    'import directives from \'@/directives\'',
    'import App from \'@/App.vue\'',
    'import getRouter from \'@/router\'',
  ]

  if (config.pinia) {
    imports.push('import { store } from \'@/stores\'')
  }
  if (config.i18n) {
    imports.push('import i18n from \'@/locales\'')
  }
  if (config.sentry) {
    imports.push('import { initSentry } from \'@/utils/sentry\'')
  }

  imports.push(
    '',
    'import \'@/assets/styles/main.scss\'',
    'import \'@/assets/fonts/index.css\'',
  )

  if (config.uiLibrary === 'element-plus') {
    imports.push('import \'@/assets/styles/element/index.scss\'')
  }

  const uses = [
    '  directives(app)',
  ]
  if (config.pinia) {
    uses.push('  app.use(store)')
  }
  uses.push('  app.use(router)')
  if (config.i18n) {
    uses.push('  app.use(i18n)')
  }
  if (config.sentry) {
    uses.push(
      '',
      '  initSentry(app, router, {',
      '    dsn: import.meta.env.VITE_SENTRY_DSN,',
      '    environment: import.meta.env.MODE,',
      '  })',
    )
  }

  return `${imports.join('\n')}

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

${uses.join('\n')}

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
 * 生成 React 项目的最终入口文件内容。
 * @param config 项目配置
 * @returns main.tsx 文件内容
 */
function createReactMainEntry(config: ProjectConfigType): string {
  if (config.microFrontend && config.microFrontendEngine === 'qiankun') {
    return createReactQiankunMainEntry(config)
  }

  const imports = [
    '/**',
    ' * React 应用入口文件',
    ' * 由 create-app 在生成阶段按已选能力合成。',
    ' */',
    '',
    'import React from \'react\'',
    'import ReactDOM from \'react-dom/client\'',
    'import { RouterProvider } from \'react-router-dom\'',
    'import { createRouter } from \'@/router\'',
  ]

  if (config.i18n) {
    imports.push('import \'@/locales\'')
  }
  if (config.sentry) {
    imports.push('import { initSentry } from \'@/utils/sentry\'')
  }

  imports.push(
    '',
    'import \'@/assets/styles/main.scss\'',
    'import \'@/assets/fonts/index.css\'',
  )

  if (config.uiLibrary === 'ant-design') {
    imports.push('import \'antd/dist/reset.css\'')
  }

  const sentrySetup = config.sentry
    ? `  initSentry({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  })

`
    : ''

  return `${imports.join('\n')}

/**
 * 获取 React 根节点，缺失时直接暴露配置错误。
 * @returns React 根 DOM 节点
 * @throws {Error} 当页面中不存在 #root 节点
 */
function getRootElement(): HTMLElement {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element #root not found')
  }
  return rootElement
}

/**
 * 初始化并挂载 React 应用。
 */
function bootstrap(): void {
${sentrySetup}  const router = createRouter()
  const root = ReactDOM.createRoot(getRootElement())

  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}

bootstrap()
`
}

/**
 * 生成 React + Qiankun 项目的最终入口文件内容。
 * @param config 项目配置
 * @returns main.tsx 文件内容
 */
function createReactQiankunMainEntry(config: ProjectConfigType): string {
  const imports = [
    '/**',
    ' * React 微前端应用入口文件',
    ' * 由 create-app 在生成阶段按已选能力合成。',
    ' */',
    '',
    'import { qiankunWindow, renderWithQiankun } from \'vite-plugin-qiankun/dist/helper\'',
    'import React from \'react\'',
    'import ReactDOM from \'react-dom/client\'',
    'import { RouterProvider } from \'react-router-dom\'',
    'import { createRouter } from \'@/router\'',
  ]

  if (config.i18n) {
    imports.push('import \'@/locales\'')
  }
  if (config.sentry) {
    imports.push('import { initSentry } from \'@/utils/sentry\'')
  }

  imports.push(
    '',
    'import \'@/assets/styles/main.scss\'',
    'import \'@/assets/fonts/index.css\'',
  )

  if (config.uiLibrary === 'ant-design') {
    imports.push('import \'antd/dist/reset.css\'')
  }

  const sentrySetup = config.sentry
    ? `  initSentry({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  })

`
    : ''

  return `${imports.join('\n')}

let root: ReturnType<typeof ReactDOM.createRoot> | null = null

/**
 * 解析 React 应用挂载节点，避免 qiankun 容器缺失时静默失败。
 * @param container qiankun 传入的容器节点
 * @returns React 可挂载的 DOM 节点
 * @throws {Error} 当页面中不存在 #root 节点
 */
function resolveRootElement(container?: Element): Element {
  if (container) {
    const target = container.querySelector('#root')
    if (!target) {
      throw new Error('Qiankun container missing #root mount target')
    }
    return target
  }

  const target = document.getElementById('root')
  if (!target) {
    throw new Error('Root element #root not found')
  }
  return target
}

/**
 * 渲染 React 应用，独立运行和 qiankun 挂载共用同一流程。
 * @param props qiankun 传入的生命周期属性
 */
function render(props: Record<string, unknown> = {}): void {
${sentrySetup}  const { container } = props as { container?: Element }
  const basename = qiankunWindow.__POWERED_BY_QIANKUN__
    ? (qiankunWindow as { __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string }).__INJECTED_PUBLIC_PATH_BY_QIANKUN__?.split('/')[1]
    : undefined
  const router = createRouter({ basename })

  root = ReactDOM.createRoot(resolveRootElement(container))
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
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
      root?.unmount()
      root = null
    },
    update() {},
  })
}
`
}

/**
 * 写入最终 Vite 配置文件。
 * @param config 项目配置
 */
function writeViteConfig(config: ProjectConfigType): void {
  const viteConfigPath = path.join(config.targetDir, 'vite.config.ts')
  let content: string
  if (config.framework === 'vue') {
    content = createVueViteConfig(config)
  }
  else if (config.framework === 'react') {
    content = createReactViteConfig(config)
  }
  else {
    throw new Error(`不支持的框架: ${config.framework}`)
  }

  fs.writeFileSync(viteConfigPath, content)
}

/**
 * 生成 Vue 项目的透明 Vite 配置。
 * @param config 项目配置
 * @returns vite.config.ts 文件内容
 */
function createVueViteConfig(config: ProjectConfigType): string {
  const imports = createViteConfigBaseImports([
    'import vue from \'@vitejs/plugin-vue\'',
    config.pageRoutes ? 'import Pages from \'vite-plugin-pages\'' : '',
    config.sentry ? 'import { sentryVitePlugin } from \'@sentry/vite-plugin\'' : '',
    config.microFrontend ? 'import qiankun from \'vite-plugin-qiankun\'' : '',
    config.uiLibrary === 'element-plus' ? 'import AutoImport from \'unplugin-auto-import/vite\'' : '',
    config.uiLibrary === 'element-plus' ? 'import Components from \'unplugin-vue-components/vite\'' : '',
    config.uiLibrary === 'element-plus' ? 'import { ElementPlusResolver } from \'unplugin-vue-components/resolvers\'' : '',
  ])

  const pluginLines = [
    '  const plugins: PluginOption[] = [vue()]',
  ]

  if (config.pageRoutes) {
    pluginLines.push(
      '',
      '  plugins.push(Pages({',
      '    dirs: \'src/pages\',',
      '    extensions: [\'vue\'],',
      '    exclude: [\'**/components/**\', \'**/__tests__/**\'],',
      '  }))',
    )
  }

  if (config.uiLibrary === 'element-plus') {
    pluginLines.push(
      '',
      '  plugins.push(AutoImport({',
      '    imports: [\'vue\'],',
      '    resolvers: [ElementPlusResolver()],',
      '    dts: \'typings/auto-imports.d.ts\',',
      '  }))',
      '  plugins.push(Components({',
      '    resolvers: [ElementPlusResolver()],',
      '    globs: [],',
      '    dts: \'typings/components.d.ts\',',
      '  }))',
    )
  }

  appendSharedVitePlugins(pluginLines, config, 'javascript-vue')

  return `${imports}

/**
 * 创建 Vue 项目的 Vite 配置。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const appCode = env.VITE_APP_CODE || ''

${pluginLines.join('\n')}

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
${createElementPlusScssConfig(config)}        },
      },
    },
  }
})
`
}

/**
 * 生成 React 项目的透明 Vite 配置。
 * @param config 项目配置
 * @returns vite.config.ts 文件内容
 */
function createReactViteConfig(config: ProjectConfigType): string {
  const imports = createViteConfigBaseImports([
    'import react from \'@vitejs/plugin-react\'',
    config.pageRoutes ? 'import Pages from \'vite-plugin-pages\'' : '',
    config.sentry ? 'import { sentryVitePlugin } from \'@sentry/vite-plugin\'' : '',
    config.microFrontend ? 'import qiankun from \'vite-plugin-qiankun\'' : '',
  ])

  const pluginLines = [
    '  const plugins: PluginOption[] = [react()]',
  ]

  if (config.pageRoutes) {
    pluginLines.push(
      '',
      '  plugins.push(Pages({',
      '    dirs: \'src/pages\',',
      '    extensions: [\'tsx\', \'jsx\'],',
      '    exclude: [\'**/components/**\', \'**/__tests__/**\'],',
      '  }))',
    )
  }

  appendSharedVitePlugins(pluginLines, config, 'javascript-react')

  return `${imports}

/**
 * 创建 React 项目的 Vite 配置。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const appCode = env.VITE_APP_CODE || ''

${pluginLines.join('\n')}

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
        },
      },
    },
  }
})
`
}

/**
 * 创建 Vite 配置的公共 import 区块。
 * @param extraImports 按功能动态追加的 import 语句
 * @returns 去重后的 import 文本
 */
function createViteConfigBaseImports(extraImports: string[]): string {
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
    ...extraImports.filter(Boolean),
  ].join('\n')
}

/**
 * 追加微前端和 Sentry 的共享 Vite 插件配置。
 * @param pluginLines 插件配置代码行
 * @param config 项目配置
 * @param sentryProject Sentry 项目名
 */
function appendSharedVitePlugins(
  pluginLines: string[],
  config: ProjectConfigType,
  sentryProject: string,
): void {
  if (config.microFrontend) {
    pluginLines.push(
      '',
      '  plugins.push(qiankun(appCode || \'app\', {',
      '    useDevMode: mode === \'development\',',
      '  }))',
    )
  }

  if (config.sentry) {
    pluginLines.push(
      '',
      '  if (env.VITE_SENTRY === \'true\' && mode === \'production\') {',
      '    plugins.push(sentryVitePlugin({',
      '      authToken: process.env.SENTRY_AUTH_TOKEN,',
      '      org: \'f1f562b9b82f\',',
      `      project: '${sentryProject}',`,
      '      sourcemaps: {',
      '        assets: \'./dist/**\',',
      '        ignore: [\'node_modules\'],',
      '      },',
      '      release: {',
      '        name: env.VITE_APP_VERSION || \'unknown\',',
      '      },',
      '    }))',
      '  }',
    )
  }
}

/**
 * 生成 Element Plus 所需的 SCSS 命名空间配置。
 * @param config 项目配置
 * @returns SCSS 配置代码片段
 */
function createElementPlusScssConfig(config: ProjectConfigType): string {
  if (config.uiLibrary !== 'element-plus') {
    return ''
  }

  return `          additionalData(source: string, filename: string) {
            if (filename.includes('assets/styles/element/index.scss')) {
              return \`$namespace: \${env.VITE_APP_CODE || 'el'};
\${source}\`
            }
            return source
          },
`
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
