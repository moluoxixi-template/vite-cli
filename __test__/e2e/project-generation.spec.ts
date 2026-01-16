/**
 * E2E 项目生成测试
 * 测试生成的项目能否正常安装依赖、类型检查、构建
 */

import path from 'node:path'
import fs from 'fs-extra'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execa } from 'execa'
import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

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
      })

      it('应该存在 package.json 文件', () => {
        const packageJsonPath = path.join(projectDir, 'package.json')
        expect(fs.existsSync(packageJsonPath)).toBe(true)
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

        if (exitCode !== 0) {
          console.error('构建失败:')
          console.error('标准输出:', stdout)
          console.error('错误输出:', stderr)
        }

        expect(exitCode).toBe(0)

        // 检查 dist 目录是否生成
        const distDir = path.join(projectDir, 'dist')
        expect(fs.existsSync(distDir)).toBe(true)
      }, 180000) // 3 minutes timeout

      it('应该有有效的构建输出', async () => {
        const distDir = path.join(projectDir, 'dist')

        if (!fs.existsSync(distDir)) {
          throw new Error('未找到 dist 目录')
        }

        const files = await fs.readdir(distDir)

        // 检查是否有 index.html
        expect(files).toContain('index.html')

        // 检查是否有 assets 目录或资源文件
        const hasAssets = files.some(f => f.startsWith('assets') || f.endsWith('.js') || f.endsWith('.css'))
        expect(hasAssets).toBe(true)
      })

      it('应该有正确的项目元数据', async () => {
        const packageJson = await fs.readJson(path.join(projectDir, 'package.json'))

        expect(packageJson.name).toBe(testConfig.config.projectName)
        expect(packageJson.description).toBe(testConfig.config.description)
        expect(packageJson.author).toBe(testConfig.config.author)
      })
    })
  }
})
