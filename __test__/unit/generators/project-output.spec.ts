/**
 * 项目输出结构测试
 * 验证生成期已经完成能力组合，目标项目不再暴露脚手架内部 loader。
 */

import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import fs from 'fs-extra'
import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'

let tempDir: string

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

afterEach(async () => {
  if (tempDir && await fs.pathExists(tempDir)) {
    await fs.remove(tempDir)
  }
})

describe('普通 Vite 项目输出', () => {
  it('应该在 Vue 项目中合成最终 main.ts 和 vite.config.ts', async () => {
    tempDir = path.join(process.cwd(), '__test__', 'temp-output-test', `vue-${Date.now()}`)

    await generateProject(createConfig())

    expect(await fs.pathExists(path.join(tempDir, 'src/main'))).toBe(false)
    expect(await fs.pathExists(path.join(tempDir, 'vite'))).toBe(false)

    const mainContent = await readGeneratedFile('src/main.ts')
    expect(mainContent).toContain('import { store } from \'@/stores\'')
    expect(mainContent).toContain('import i18n from \'@/locales\'')
    expect(mainContent).toContain('import \'@/assets/styles/element/index.scss\'')
    expect(mainContent).toContain('app.use(store)')
    expect(mainContent).toContain('app.use(i18n)')
    expect(mainContent).not.toContain('@/main/index')
    expect(mainContent).not.toContain('setupFeatures')

    const viteConfig = await readGeneratedFile('vite.config.ts')
    expect(viteConfig).toContain('import vue from \'@vitejs/plugin-vue\'')
    expect(viteConfig).toContain('import Pages from \'vite-plugin-pages\'')
    expect(viteConfig).toContain('defineConfig')
    expect(viteConfig).not.toContain('@moluoxixi/vite-config')
    expect(viteConfig).not.toContain('./vite/index')

    const packageJson = await fs.readJson(path.join(tempDir, 'package.json'))
    expect(packageJson.devDependencies).toHaveProperty('@vitejs/plugin-vue')
    expect(packageJson.devDependencies).not.toHaveProperty('@moluoxixi/vite-config')
    expect(packageJson.devDependencies).not.toHaveProperty('@moluoxixi/css-module-global-root-plugin')
  })
})
