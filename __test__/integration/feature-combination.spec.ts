/**
 * Feature 组合集成测试
 * 基于文件系统自动扫描 templates/ 目录，生成所有测试组合
 * 当添加新的 template feature 时，测试会自动覆盖
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import {
  scanAllImports,
} from '@test/dependency-validator'
import {
  cleanupTempDir,
  createTempDir,
} from '@test/test-utils'
import { generateTestConfigs } from '@test/test-config-generator'

// 🔍 自动扫描生成测试配置（基于文件系统）
const TEST_CONFIGS = generateTestConfigs()

describe('功能组合集成测试（基于文件系统）', () => {
  // 按框架分组
  const vueConfigs = TEST_CONFIGS.filter(c => c.config.framework === 'vue')
  const reactConfigs = TEST_CONFIGS.filter(c => c.config.framework === 'react')

  console.log(`\n🔍 自动扫描生成 ${TEST_CONFIGS.length} 个测试用例:`)
  console.log(`  - Vue: ${vueConfigs.length} 个`)
  console.log(`  - React: ${reactConfigs.length} 个\n`)

  // Vue 项目测试
  if (vueConfigs.length > 0) {
    describe('vue 项目', () => {
      for (const testConfig of vueConfigs) {
        describe(testConfig.name, () => {
          let projectDir: string

          beforeAll(async () => {
            projectDir = await createTempDir(`test-${testConfig.name}-`)
            const config: ProjectConfigType = {
              ...testConfig.config as ProjectConfigType,
              targetDir: projectDir,
            }
            await generateProject(config)
          }, 60000)

          afterAll(async () => {
            await cleanupTempDir(projectDir)
          })

          it('应该只从自己的包导入（无跨模板导入）', async () => {
            const imports = await scanAllImports(projectDir)

            // 找出所有跨模板的 import（不允许引用其他模板）
            const crossTemplateImports = imports.filter(imp =>
              imp.includes('../../templates/')
              || imp.includes('../../../common/')
              || imp.includes('../../../vue/')
              || imp.includes('../../../react/'),
            )

            expect(crossTemplateImports).toEqual([])
          })
        })
      }
    })
  }

  // React 项目测试（如果有）
  if (reactConfigs.length > 0) {
    describe('react 项目', () => {
      for (const testConfig of reactConfigs) {
        describe(testConfig.name, () => {
          let projectDir: string

          beforeAll(async () => {
            projectDir = await createTempDir(`test-${testConfig.name}-`)
            const config: ProjectConfigType = {
              ...testConfig.config as ProjectConfigType,
              targetDir: projectDir,
            }
            await generateProject(config)
          }, 60000)

          afterAll(async () => {
            await cleanupTempDir(projectDir)
          })

          it('应该只从自己的包导入（无跨模板导入）', async () => {
            const imports = await scanAllImports(projectDir)

            const crossTemplateImports = imports.filter(imp =>
              imp.includes('../../templates/')
              || imp.includes('../../../common/')
              || imp.includes('../../../vue/')
              || imp.includes('../../../react/'),
            )

            expect(crossTemplateImports).toEqual([])
          })
        })
      }
    })
  }
})
