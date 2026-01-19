/**
 * E2E 项目生成测试
 * 测试生成的项目能否正常安装依赖、类型检查、构建
 */

import path from 'node:path'
import fs from 'fs-extra'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execa } from 'execa'
import { resolveConfig } from 'vite'
import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

/**
 * 获取 Vite 配置中的输出目录
 * @param projectRoot - 项目根目录路径
 * @param mode - 构建模式，默认为 'production'
 * @returns 输出目录路径，如果未配置则返回 'dist'
 */
async function getViteOutDir(projectRoot: string, mode: string = 'production'): Promise<string> {
  try {
    const viteConfig = await resolveConfig({ root: projectRoot }, 'build', mode)
    const outDir = viteConfig.build.outDir

    if (outDir) {
      return outDir
    }

    // 如果未配置，返回默认值
    return 'dist'
  }
  catch (error) {
    console.warn('Failed to load vite config, using default outDir:', error)
    return 'dist'
  }
}

/**
 * E2E 测试配置（选择几个代表性的配置进行完整测试）
 * 注意：E2E 测试需要安装依赖和构建，运行时间较长（5-10 分钟）
 */
const E2E_TEST_CONFIGS = [
  {
    name: 'vue-element-plus-full',
    config: {
      framework: 'vue',
      uiLibrary: 'element-plus',
      routeMode: 'manualRoutes',
      pinia: true,
      manualRoutes: true,
      pageRoutes: false,
      i18n: true,
      sentry: false,
      eslint: true,
      husky: true,
      microFrontend: false,
      packageManager: 'pnpm',
      projectName: 'test-vue-e2e',
      description: 'E2E test project',
      author: 'test',
    } as ProjectConfigType,
  },
  // TODO: 启用 React E2E 测试（当 React 模板准备好后）
  // {
  //   name: 'react-ant-design-full',
  //   config: {
  //     framework: 'react',
  //     uiLibrary: 'ant-design',
  //     routeMode: 'manualRoutes',
  //     zustand: true,
  //     manualRoutes: true,
  //     pageRoutes: false,
  //     i18n: true,
  //     sentry: false,
  //     eslint: true,
  //     husky: true,
  //     microFrontend: false,
  //     packageManager: 'pnpm',
  //     projectName: 'test-react-e2e',
  //     description: 'E2E test project',
  //     author: 'test',
  //   } as ProjectConfigType,
  // },
]

describe('e2e 项目生成测试', () => {
  for (const testConfig of E2E_TEST_CONFIGS) {
    describe(testConfig.name, () => {
      let projectDir: string

      beforeAll(async () => {
        projectDir = await createTempDir(`e2e-${testConfig.name}-`)
        const config = {
          ...testConfig.config,
          targetDir: projectDir,
        }
        await generateProject(config)
      }, 120000)

      afterAll(async () => {
        // 清理测试项目（注意：如果需要调试，可以注释掉这行）
        await cleanupTempDir(projectDir)
      }, 120000)

      it('应该存在 package.json 文件', () => {
        const packageJsonPath = path.join(projectDir, 'package.json')
        expect(fs.existsSync(packageJsonPath)).toBe(true)
      })

      it('应该有有效的 package.json 结构和元数据', async () => {
        const packageJson = await fs.readJson(path.join(projectDir, 'package.json'))

        // 验证 package.json 基本结构
        expect(packageJson.type).toBe('module')
        expect(packageJson.scripts).toBeDefined()
        expect(packageJson.dependencies).toBeDefined()
        expect(packageJson.devDependencies).toBeDefined()

        // 验证项目元数据
        expect(packageJson.name).toBe(testConfig.config.projectName)
        expect(packageJson.description).toBe(testConfig.config.description)
        expect(packageJson.author).toBe(testConfig.config.author)
      })

      it('应该成功安装依赖', async () => {
        const { exitCode, stderr } = await execa('pnpm', ['install'], {
          cwd: projectDir,
          reject: false,
        })

        if (exitCode !== 0) {
          console.error('依赖安装失败:', stderr)
        }

        expect(exitCode).toBe(0)
      }, 180000) // 3 minutes timeout

      it('应该通过类型检查', async () => {
        const { exitCode, stdout, stderr } = await execa('pnpm', ['type-check'], {
          cwd: projectDir,
          reject: false,
        })

        if (exitCode !== 0) {
          console.error('类型检查失败:')
          console.error('标准输出:', stdout)
          console.error('错误输出:', stderr)
        }

        expect(exitCode).toBe(0)
      }, 120000)

      it('应该通过代码检查', async () => {
        if (!testConfig.config.eslint) {
          return
        }

        const { exitCode, stderr } = await execa('pnpm', ['lint:eslint'], {
          cwd: projectDir,
          reject: false,
        })

        if (exitCode !== 0) {
          console.error('代码检查失败:', stderr)
        }

        expect(exitCode).toBe(0)
      }, 120000)

      it('应该成功构建', async () => {
        const { exitCode, stdout, stderr } = await execa('pnpm', ['build'], {
          cwd: projectDir,
          reject: false,
        })

        const outDir = await getViteOutDir(projectDir, 'production')
        const distDir = path.join(projectDir, outDir)
        const distExists = fs.existsSync(distDir)

        if (exitCode !== 0 || !distExists) {
          console.error('构建失败:')
          console.error('退出码:', exitCode)
          console.error('标准输出:', stdout)
          console.error('错误输出:', stderr)
          if (!distExists) {
            console.error(`${outDir} 目录不存在`)
          }
        }

        expect(exitCode).toBe(0)

        // 检查构建输出目录是否生成
        expect(distExists).toBe(true)
      }, 180000) // 3 minutes timeout

      it('应该有有效的构建输出', async () => {
        const outDir = await getViteOutDir(projectDir, 'production')
        const distDir = path.join(projectDir, outDir)

        if (!fs.existsSync(distDir)) {
          throw new Error(`未找到 ${outDir} 目录`)
        }

        const files = await fs.readdir(distDir)

        // 检查是否有 index.html
        expect(files).toContain('index.html')

        // 检查是否有 assets 或 static 目录，或者有 .js/.css 文件
        const hasAssets = files.some((f) => {
          const fullPath = path.join(distDir, f)
          const stat = fs.statSync(fullPath)
          return f.startsWith('assets') || f.startsWith('static') || f.endsWith('.js') || f.endsWith('.css') || (stat.isDirectory() && (f === 'assets' || f === 'static'))
        })
        expect(hasAssets).toBe(true)
      })
    })
  }
})
