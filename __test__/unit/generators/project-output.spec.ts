/**
 * 项目输出结构测试
 * 验证生成期已经完成能力组合，目标项目不再暴露脚手架内部 loader。
 */

import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import fs from 'fs-extra'
import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import { TRANSPARENT_AJAX_SOURCE_FILES } from '@test/test-utils'

let tempDir: string

interface GeneratedPackageJson {
  dependencies?: Record<string, string>
}

/**
 * 创建用于真实生成项目的测试配置。
 * @param overrides 覆盖默认配置的字段
 * @returns 完整项目配置
 */
function createConfig(overrides: Partial<ProjectConfigType> = {}): ProjectConfigType {
  return {
    projectName: 'atomized-output',
    description: 'Atomized project output',
    author: 'test',
    framework: 'vue',
    uiLibrary: 'element-plus',
    routeMode: 'pageRoutes',
    pinia: true,
    zustand: false,
    manualRoutes: false,
    pageRoutes: true,
    i18n: true,
    sentry: true,
    eslint: false,
    husky: false,
    microFrontend: false,
    packageManager: 'pnpm',
    targetDir: tempDir,
    ...overrides,
  }
}

/**
 * 读取生成项目中的文本文件。
 * @param filePath 目标项目内的相对路径
 * @returns 文件内容
 */
async function readGeneratedFile(filePath: string): Promise<string> {
  return fs.readFile(path.join(tempDir, filePath), 'utf-8')
}

function expectTransparentViteConfig(viteConfig: string): void {
  expect(viteConfig).toContain('import { fileURLToPath, URL } from \'node:url\'')
  expect(viteConfig).toContain('root: envDir')
  expect(viteConfig).not.toContain('import F{')
  expect(viteConfig).not.toContain('@moluoxixi/vite-config')
}

async function expectTransparentAjaxOutput(packageJson: GeneratedPackageJson): Promise<void> {
  expect(packageJson.dependencies).toHaveProperty('axios', '^1.16.1')
  expect(packageJson.dependencies).not.toHaveProperty('@moluoxixi/ajax-package')
  for (const fileName of TRANSPARENT_AJAX_SOURCE_FILES) {
    expect(await fs.pathExists(path.join(tempDir, 'src/apis/ajax', fileName))).toBe(true)
  }

  const requestContent = await readGeneratedFile('src/apis/request.ts')
  expect(requestContent).toContain('from \'./ajax\'')
  expect(requestContent).not.toContain('@moluoxixi/ajax-package')

  const clientContent = await readGeneratedFile('src/apis/ajax/BaseHttpClient.ts')
  expect(clientContent).toContain('this.instance = axios.create(axiosConfig)')

  const pathContent = await readGeneratedFile('src/apis/ajax/path.ts')
  expect(pathContent).toContain('from \'./readValueByPath\'')
  expect(pathContent).not.toContain('@moluoxixi/utils')
}

function expectNativeElementLayout(elementLayout: string): void {
  expect(elementLayout).toContain('<ElConfigProvider :empty-values="[undefined]">')
  expect(elementLayout).toContain('style="--el-header-padding: 0"')
  expect(elementLayout).not.toContain(':namespace=')
  expect(elementLayout).not.toContain(':deep(.el-')
  expect(elementLayout).not.toContain('class="headerbox"')
  expect(elementLayout).not.toContain('bg-primary')
  expect(elementLayout).not.toContain('--el-main-padding')
}

function expectRecursiveElementSubMenu(subMenuContent: string): void {
  expect(subMenuContent).toContain('<ElSubMenu')
  expect(subMenuContent).toContain('<SubMenu')
  expect(subMenuContent).toContain('createMenuTree(props.routes)')
  expect(subMenuContent).not.toContain('<div :style=')
}

function expectNativeElementStyles(elementStyles: string): void {
  expect(elementStyles.trim()).toBe('@use \'element-plus/theme-chalk/src/index.scss\' as *;')
}

function expectNativeAntLayout(appContent: string): void {
  expect(appContent).toContain('ConfigProvider theme={layoutTheme}')
  expect(appContent).toContain('headerPadding: 0')
  expect(appContent).toContain('label: \'三级标题\'')
  expect(appContent).toContain('routes={menuItems}')
  expect(appContent).not.toContain('items={menuItems}')
}

function expectRecursiveAntSubMenu(subMenuContent: string): void {
  expect(subMenuContent).toContain('items={createMenuItems(routes)}')
  expect(subMenuContent).toContain('children: createMenuItems(route.children)')
  expect(subMenuContent).toContain('NonNullable<MenuProps[\'items\']>')
}

/**
 * 收集目标项目中所有以下划线开头的目录。
 * @param rootDir 目标项目根目录
 * @param relativeDir 当前递归目录，相对于目标项目根目录
 * @returns 以下划线开头的目录相对路径列表
 */
async function collectUnderscorePrefixedDirectories(
  rootDir: string,
  relativeDir = '',
): Promise<string[]> {
  const currentDir = path.join(rootDir, relativeDir)
  const entries = await fs.readdir(currentDir, { withFileTypes: true })
  const directories: string[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const entryRelativePath = path.join(relativeDir, entry.name)
    if (entry.name.startsWith('_')) {
      directories.push(entryRelativePath)
    }

    directories.push(...await collectUnderscorePrefixedDirectories(rootDir, entryRelativePath))
  }

  return directories
}

afterEach(async () => {
  if (tempDir && await fs.pathExists(tempDir)) {
    await fs.remove(tempDir)
  }
})

describe('普通 Vite 项目输出', () => {
  it('应该在 Vue 项目中合成最终 main.ts 和 vite.config.ts', async () => {
    tempDir = path.join(process.cwd(), '__test__', 'temp-output-test', `vue-${Date.now()}`)

    await generateProject(createConfig({ eslint: true }))

    expect(await fs.pathExists(path.join(tempDir, 'src/main'))).toBe(false)
    expect(await fs.pathExists(path.join(tempDir, 'vite'))).toBe(false)
    expect(await fs.pathExists(path.join(tempDir, 'atom.mjs'))).toBe(false)

    const mainContent = await readGeneratedFile('src/main.ts')
    expect(mainContent).toContain('import { store } from \'@/stores\'')
    expect(mainContent).toContain('import i18n from \'@/locales\'')
    expect(mainContent).toContain('import \'@/assets/styles/element/index.scss\'')
    expect(mainContent).toContain('app.use(store)')
    expect(mainContent).toContain('app.use(i18n)')
    expect(mainContent).not.toContain('@/main/index')
    expect(mainContent).not.toContain('setupFeatures')

    const elementLayout = await readGeneratedFile('src/layouts/element.vue')
    expectNativeElementLayout(elementLayout)
    const subMenuContent = await readGeneratedFile('src/components/SubMenu/src/index.vue')
    expectRecursiveElementSubMenu(subMenuContent)

    const elementStyles = await readGeneratedFile('src/assets/styles/element/index.scss')
    expectNativeElementStyles(elementStyles)

    const viteConfig = await readGeneratedFile('vite.config.ts')
    expectTransparentViteConfig(viteConfig)
    expect(viteConfig).toContain('import vue from \'@vitejs/plugin-vue\'')
    expect(viteConfig).toContain('import Pages from \'vite-plugin-pages\'')
    expect(viteConfig).toContain('defineConfig')
    expect(viteConfig).not.toContain('./vite/index')
    expect(viteConfig).not.toContain('additionalData')

    const packageJson = await fs.readJson(path.join(tempDir, 'package.json'))
    await expectTransparentAjaxOutput(packageJson)
    expect(packageJson.devDependencies).toHaveProperty('@vitejs/plugin-vue')
    expect(packageJson.devDependencies).toHaveProperty('@moluoxixi/eslint-config', '0.0.19')
    expect(packageJson.devDependencies).toHaveProperty('eslint', '^10.0.0')
    expect(packageJson.devDependencies).toHaveProperty('eslint')
    expect(packageJson.devDependencies).not.toHaveProperty('eslint-plugin-vue')
    expect(packageJson.devDependencies).not.toHaveProperty('@antfu/eslint-config')
    expect(packageJson.devDependencies).not.toHaveProperty('@eslint-react/eslint-plugin')
    expect(packageJson.devDependencies).not.toHaveProperty('eslint-plugin-react-refresh')
    expect(packageJson.devDependencies).not.toHaveProperty('@moluoxixi/vite-config')
    expect(packageJson.devDependencies).not.toHaveProperty('@moluoxixi/css-module-global-root-plugin')
    expect(packageJson.scripts).toHaveProperty('lint:eslint', 'eslint .')

    const eslintConfig = await readGeneratedFile('eslint.config.ts')
    expect(eslintConfig).toContain('from \'@moluoxixi/eslint-config\'')
    expect(eslintConfig).not.toContain('vue:')
    expect(eslintConfig).not.toContain('react:')
    expect(eslintConfig).not.toContain('formatters:')
    expect(eslintConfig).not.toContain('.removeRules(\'vue/block-order\')')
    expect(eslintConfig).not.toContain('typescript:')
    expect(eslintConfig).not.toContain('eslint-plugin-vue')

    expect(await collectUnderscorePrefixedDirectories(tempDir)).toEqual([])
  })

  it('应该在 qiankun 项目中不生成下划线开头目录', async () => {
    tempDir = path.join(process.cwd(), '__test__', 'temp-output-test', `qiankun-${Date.now()}`)

    await generateProject(createConfig({
      projectName: 'atomized-qiankun-output',
      microFrontend: true,
      microFrontendEngine: 'qiankun',
      husky: true,
      sentry: false,
    }))

    expect(await fs.pathExists(path.join(tempDir, 'src/components/SubMenu/src/types'))).toBe(true)
    expect(await fs.pathExists(path.join(tempDir, 'src/components/SubMenu/src/_types'))).toBe(false)
    const elementLayout = await readGeneratedFile('src/layouts/element.vue')
    expectNativeElementLayout(elementLayout)
    const subMenuContent = await readGeneratedFile('src/components/SubMenu/src/index.vue')
    expectRecursiveElementSubMenu(subMenuContent)
    const elementStyles = await readGeneratedFile('src/assets/styles/element/index.scss')
    expectNativeElementStyles(elementStyles)
    expect(await fs.pathExists(path.join(tempDir, 'src/assets/styles/element/fixQiankun.scss'))).toBe(false)
    const viteConfig = await readGeneratedFile('vite.config.ts')
    expectTransparentViteConfig(viteConfig)
    expect(viteConfig).toContain('if (env.VITE_STANDALONE !== \'true\')')
    const packageJson = await fs.readJson(path.join(tempDir, 'package.json'))
    await expectTransparentAjaxOutput(packageJson)
    expect(packageJson.scripts).not.toHaveProperty('lint:eslint')
    expect(await fs.pathExists(path.join(tempDir, 'eslint.config.ts'))).toBe(false)
    expect(await collectUnderscorePrefixedDirectories(tempDir)).toEqual([])
  })

  it('应该生成纯净的 React standard main.tsx', async () => {
    tempDir = path.join(process.cwd(), '__test__', 'temp-output-test', `react-${Date.now()}`)

    await generateProject(createConfig({
      projectName: 'react-standard-output',
      framework: 'react',
      uiLibrary: 'ant-design',
      pinia: false,
      zustand: true,
      eslint: true,
      microFrontend: false,
    }))

    const mainContent = await readGeneratedFile('src/main.tsx')
    expect(mainContent).toContain('createRoot(rootElement).render(')
    expect(mainContent).toContain('<RouterProvider router={router} />')
    expect(mainContent).toContain('import \'@/locales\'')
    expect(mainContent).toContain('import \'antd/dist/reset.css\'')
    expect(mainContent).not.toContain('renderWithQiankun')
    expect(mainContent).not.toContain('__POWERED_BY_QIANKUN__')
    expect(mainContent).not.toContain('startTransition')
    expect(await fs.pathExists(path.join(tempDir, 'src/main.ts'))).toBe(false)

    const appContent = await readGeneratedFile('src/App.tsx')
    expectNativeAntLayout(appContent)
    const subMenuContent = await readGeneratedFile('src/components/SubMenu/index.tsx')
    expectRecursiveAntSubMenu(subMenuContent)

    const viteConfig = await readGeneratedFile('vite.config.ts')
    expectTransparentViteConfig(viteConfig)
    expect(viteConfig).toContain('import react from \'@vitejs/plugin-react\'')
    expect(viteConfig).toContain('import Pages from \'vite-plugin-pages\'')
    expect(viteConfig).not.toContain('vite-plugin-qiankun')

    const eslintConfig = await readGeneratedFile('eslint.config.ts')
    expect(eslintConfig).toContain('from \'@moluoxixi/eslint-config\'')
    expect(eslintConfig).not.toContain('vue:')
    expect(eslintConfig).not.toContain('react:')
    expect(eslintConfig).not.toContain('formatters:')
    expect(eslintConfig).not.toContain('.removeRules(\'vue/block-order\')')
    expect(eslintConfig).not.toContain('typescript:')

    const packageJson = await fs.readJson(path.join(tempDir, 'package.json'))
    await expectTransparentAjaxOutput(packageJson)
    expect(packageJson.devDependencies).toHaveProperty('@moluoxixi/eslint-config', '0.0.19')
    expect(packageJson.devDependencies).toHaveProperty('eslint', '^10.0.0')
    expect(packageJson.devDependencies).toHaveProperty('@eslint-react/eslint-plugin', '^3.0.0')
    expect(packageJson.devDependencies).toHaveProperty('eslint-plugin-react-refresh', '^0.5.0')
    expect(packageJson.devDependencies).not.toHaveProperty('@antfu/eslint-config')
    expect(packageJson.devDependencies).not.toHaveProperty('eslint-plugin-vue')
    expect(packageJson.scripts).toHaveProperty('lint:eslint', 'eslint .')
  })

  it('应该生成独立治理的 React qiankun 生命周期入口', async () => {
    tempDir = path.join(process.cwd(), '__test__', 'temp-output-test', `react-qiankun-${Date.now()}`)

    await generateProject(createConfig({
      projectName: 'react-qiankun-output',
      framework: 'react',
      uiLibrary: 'ant-design',
      routeMode: 'manualRoutes',
      pinia: false,
      zustand: true,
      manualRoutes: true,
      pageRoutes: false,
      microFrontend: true,
      microFrontendEngine: 'qiankun',
    }))

    const mainContent = await readGeneratedFile('src/main.tsx')
    expect(mainContent).toContain('import { startTransition, StrictMode } from \'react\'')
    expect(mainContent).toContain('renderWithQiankun')
    expect(mainContent).toContain('props.activeRule ?? props.data?.activeRule')
    expect(mainContent).toContain('startTransition(() => {')
    expect(mainContent).toContain('root?.unmount()')
    expect(mainContent).toContain('root = null')
    expect(await fs.pathExists(path.join(tempDir, 'src/types/qiankun.ts'))).toBe(true)

    const appContent = await readGeneratedFile('src/App.tsx')
    expectNativeAntLayout(appContent)
    const subMenuContent = await readGeneratedFile('src/components/SubMenu/index.tsx')
    expectRecursiveAntSubMenu(subMenuContent)

    const viteConfig = await readGeneratedFile('vite.config.ts')
    expectTransparentViteConfig(viteConfig)
    expect(viteConfig).toContain('import qiankun from \'vite-plugin-qiankun\'')
    expect(viteConfig).toContain('if (env.VITE_STANDALONE !== \'true\')')
    expect(viteConfig).toContain('mode !== \'development\' || env.VITE_STANDALONE === \'true\'')

    const packageJson = await fs.readJson(path.join(tempDir, 'package.json'))
    await expectTransparentAjaxOutput(packageJson)
  })
})
