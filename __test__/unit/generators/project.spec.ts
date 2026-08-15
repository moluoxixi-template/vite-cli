/**
 * project.ts 单元测试
 * 测试项目生成器
 */

import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'fs-extra'
import type { ProjectConfigType } from '@/types'
import { FRAMEWORKS, PACKAGE_MANAGERS } from '@/constants'

// Mock 依赖模块
vi.mock('@/core/feature', () => ({
  renderCommonFeatures: vi.fn(),
  renderFrameworkFeatures: vi.fn(),
  renderMicroFrontendFeatures: vi.fn(),
}))

vi.mock('@/core/template', () => ({
  renderTemplate: vi.fn(),
  updatePackageJsonMetadata: vi.fn(),
}))

vi.mock('@/core/projectOutput', () => ({
  finalizeProjectOutput: vi.fn(),
}))

vi.mock('@/utils/file', async (importOriginal) => {
  const original = await importOriginal() as Record<string, unknown>
  return {
    ...original,
    emptyDir: vi.fn(),
    getTemplatesDir: vi.fn(() => '/mock/templates'),
  }
})

// 动态导入被测模块
const { generateProject } = await import('@/generators/project')

// 测试用临时目录
let tempDir: string

/**
 * 创建有效的测试配置
 * @param overrides 覆盖的配置项
 * @returns 完整的 ProjectConfigType 对象
 */
function createTestConfig(overrides: Partial<ProjectConfigType> = {}): ProjectConfigType {
  return {
    projectName: 'test-project',
    description: 'Test description',
    author: 'Test Author',
    framework: 'vue',
    uiLibrary: 'element-plus',
    routeMode: 'manualRoutes',
    pinia: true,
    zustand: false,
    manualRoutes: true,
    pageRoutes: false,
    i18n: false,
    sentry: false,
    eslint: true,
    husky: true,
    microFrontend: false,
    packageManager: 'pnpm',
    targetDir: tempDir || '/tmp/test',
    ...overrides,
  }
}

beforeEach(async () => {
  tempDir = path.join(process.cwd(), '__test__', 'temp-project-test', `test-${Date.now()}`)
  await fs.ensureDir(tempDir)
  vi.clearAllMocks()
})

afterEach(async () => {
  if (await fs.pathExists(tempDir)) {
    await fs.remove(tempDir)
  }
})

describe('generateProject', () => {
  describe('框架验证', () => {
    it('应该接受所有支持的框架', async () => {
      for (const framework of FRAMEWORKS) {
        const config = createTestConfig({
          framework,
          uiLibrary: framework === 'vue' ? 'element-plus' : 'ant-design',
          pinia: framework === 'vue',
          zustand: framework === 'react',
          targetDir: path.join(tempDir, `test-${framework}`),
        })

        await expect(generateProject(config)).resolves.not.toThrow()
      }
    })

    it('应该拒绝不支持的框架', async () => {
      const config = createTestConfig({
        framework: 'unsupported' as any,
        targetDir: tempDir,
      })

      await expect(generateProject(config))
        .rejects
        .toThrow('不支持的框架')
    })

    it('应该在修改目标目录前拒绝非法能力组合', async () => {
      const config = createTestConfig({
        microFrontend: true,
      })
      const { emptyDir } = await import('@/utils/file')
      const { renderTemplate } = await import('@/core/template')
      const { finalizeProjectOutput } = await import('@/core/projectOutput')

      await expect(generateProject(config))
        .rejects
        .toThrow('必须提供 microFrontendEngine')

      expect(emptyDir).not.toHaveBeenCalled()
      expect(renderTemplate).not.toHaveBeenCalled()
      expect(finalizeProjectOutput).not.toHaveBeenCalled()
    })
  })

  describe('模板渲染流程', () => {
    it('应该调用 emptyDir 清空目标目录', async () => {
      const config = createTestConfig({ targetDir: tempDir })
      const { emptyDir } = await import('@/utils/file')

      await generateProject(config)

      expect(emptyDir).toHaveBeenCalledWith(tempDir)
    })

    it('应该渲染公共基础模板', async () => {
      const config = createTestConfig({ targetDir: tempDir })
      const { renderTemplate } = await import('@/core/template')

      await generateProject(config)

      // 验证渲染了 common/base
      expect(renderTemplate).toHaveBeenCalledWith(
        expect.stringContaining('common'),
        tempDir,
      )
    })

    it('应该渲染框架基础模板', async () => {
      const config = createTestConfig({ targetDir: tempDir, framework: 'vue' })
      const { renderTemplate } = await import('@/core/template')

      await generateProject(config)

      // 验证渲染了框架 base
      expect(renderTemplate).toHaveBeenCalledWith(
        expect.stringContaining('vue'),
        tempDir,
      )
    })

    it('应该渲染公共 features', async () => {
      const config = createTestConfig({ targetDir: tempDir })
      const { renderCommonFeatures } = await import('@/core/feature')

      await generateProject(config)

      expect(renderCommonFeatures).toHaveBeenCalledWith(config, tempDir)
    })

    it('应该渲染框架 features', async () => {
      const config = createTestConfig({ targetDir: tempDir })
      const { renderFrameworkFeatures } = await import('@/core/feature')

      await generateProject(config)

      expect(renderFrameworkFeatures).toHaveBeenCalledWith(config, tempDir)
    })

    it('应该把规范化后的派生 feature 传给下游', async () => {
      const config = createTestConfig({
        pinia: undefined,
        zustand: undefined,
        manualRoutes: undefined,
        pageRoutes: undefined,
      })
      const { renderFrameworkFeatures } = await import('@/core/feature')
      const { finalizeProjectOutput } = await import('@/core/projectOutput')

      await generateProject(config)

      const normalizedConfig = expect.objectContaining({
        pinia: true,
        zustand: false,
        manualRoutes: true,
        pageRoutes: false,
      })
      expect(renderFrameworkFeatures).toHaveBeenCalledWith(normalizedConfig, tempDir)
      expect(finalizeProjectOutput).toHaveBeenCalledWith(normalizedConfig)
      expect(config.pinia).toBeUndefined()
      expect(config.manualRoutes).toBeUndefined()
    })
  })

  describe('微前端支持', () => {
    it('应该在启用微前端时渲染微前端基础模板', async () => {
      const config = createTestConfig({
        targetDir: tempDir,
        microFrontend: true,
        microFrontendEngine: 'qiankun',
      })
      const { renderTemplate } = await import('@/core/template')

      await generateProject(config)

      // 验证渲染了微前端 base
      expect(renderTemplate).toHaveBeenCalledWith(
        expect.stringContaining('micro-frontends'),
        tempDir,
      )
    })

    it('应该在启用微前端时渲染微前端 features', async () => {
      const config = createTestConfig({
        targetDir: tempDir,
        microFrontend: true,
        microFrontendEngine: 'qiankun',
      })
      const { renderMicroFrontendFeatures } = await import('@/core/feature')

      await generateProject(config)

      expect(renderMicroFrontendFeatures).toHaveBeenCalledWith(config, tempDir, 'qiankun')
    })

    it('应该在禁用微前端时不渲染微前端模板', async () => {
      const config = createTestConfig({
        targetDir: tempDir,
        microFrontend: false,
      })
      const { renderMicroFrontendFeatures } = await import('@/core/feature')

      await generateProject(config)

      expect(renderMicroFrontendFeatures).not.toHaveBeenCalled()
    })
  })

  describe('package.json 元数据更新', () => {
    it('应该更新 package.json 元数据', async () => {
      const config = createTestConfig({
        targetDir: tempDir,
        projectName: 'my-project',
        description: 'My description',
        author: 'Me',
        packageManager: 'pnpm',
      })
      const { updatePackageJsonMetadata } = await import('@/core/template')

      await generateProject(config)

      expect(updatePackageJsonMetadata).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        'my-project',
        'My description',
        'Me',
        'pnpm',
      )
    })

    it('应该在模板和元数据处理后整理最终项目输出', async () => {
      const config = createTestConfig({ targetDir: tempDir })
      const { finalizeProjectOutput } = await import('@/core/projectOutput')

      await generateProject(config)

      expect(finalizeProjectOutput).toHaveBeenCalledWith(config)
    })
  })

  describe('包管理器特定文件处理', () => {
    it('应该在非 yarn 时删除 .yarnrc.yml', async () => {
      // 创建 .yarnrc.yml 文件
      const yarnrcPath = path.join(tempDir, '.yarnrc.yml')
      await fs.writeFile(yarnrcPath, 'nodeLinker: node-modules')

      const config = createTestConfig({
        targetDir: tempDir,
        packageManager: 'pnpm',
      })

      await generateProject(config)

      expect(await fs.pathExists(yarnrcPath)).toBe(false)
    })

    it('应该在 yarn 时保留 .yarnrc.yml', async () => {
      const yarnrcPath = path.join(tempDir, '.yarnrc.yml')
      await fs.writeFile(yarnrcPath, 'nodeLinker: node-modules')
      const config = createTestConfig({
        targetDir: tempDir,
        packageManager: 'yarn',
      })

      await generateProject(config)

      expect(await fs.pathExists(yarnrcPath)).toBe(true)
    })
  })

  describe('包管理器支持', () => {
    for (const pm of PACKAGE_MANAGERS) {
      it(`应该支持 ${pm} 包管理器`, async () => {
        const config = createTestConfig({
          targetDir: path.join(tempDir, `test-${pm}`),
          packageManager: pm,
        })

        await expect(generateProject(config)).resolves.not.toThrow()
      })
    }
  })

  describe('配置组合', () => {
    it('应该处理完整配置', async () => {
      const config = createTestConfig({
        targetDir: tempDir,
        framework: 'vue',
        uiLibrary: 'element-plus',
        routeMode: 'pageRoutes',
        manualRoutes: false,
        pageRoutes: true,
        i18n: true,
        sentry: true,
        eslint: true,
        husky: true,
        microFrontend: true,
        microFrontendEngine: 'qiankun',
        packageManager: 'pnpm',
      })

      await expect(generateProject(config)).resolves.not.toThrow()
    })

    it('应该处理最小配置', async () => {
      const config = createTestConfig({
        targetDir: tempDir,
        i18n: false,
        sentry: false,
        eslint: false,
        husky: false,
        microFrontend: false,
      })

      await expect(generateProject(config)).resolves.not.toThrow()
    })
  })
})
