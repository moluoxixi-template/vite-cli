/**
 * Feature 组合集成测试
 * 基于文件系统自动扫描 templates/ 目录，生成所有测试组合
 * 当添加新的 template feature 时，测试会自动覆盖
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import {
  findCatalogReferences,
  readPackageJson,
  scanAllImports,
} from '@test/dependency-validator'
import {
  cleanupTempDir,
  createTempDir,
} from '@test/test-utils'
import { generateTestConfigs } from '@test/test-config-generator'

// 🔍 自动扫描生成测试配置（基于文件系统）
const TEST_CONFIGS = generateTestConfigs()

describe('feature Combination Integration Tests (File System Based)', () => {
  // 按框架分组
  const vueConfigs = TEST_CONFIGS.filter(c => c.config.framework === 'vue')
  const reactConfigs = TEST_CONFIGS.filter(c => c.config.framework === 'react')

  console.log(`\n🔍 自动扫描生成 ${TEST_CONFIGS.length} 个测试用例:`)
  console.log(`  - Vue: ${vueConfigs.length} 个`)
  console.log(`  - React: ${reactConfigs.length} 个\n`)

  // Vue 项目测试
  if (vueConfigs.length > 0) {
    describe('vue Projects', () => {
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

          it('should not have catalog references in package.json', async () => {
            const packageJson = await readPackageJson(projectDir)
            const catalogRefs = findCatalogReferences(packageJson)

            expect(catalogRefs).toEqual([])
          })

          it('should only import from own package (no cross-template imports)', async () => {
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

          it('should have valid package.json structure', async () => {
            const packageJson = await readPackageJson(projectDir)

            expect(packageJson.name).toBe(testConfig.config.projectName)
            expect(packageJson.description).toBe(testConfig.config.description)
            expect(packageJson.author).toBe(testConfig.config.author)
            expect(packageJson.type).toBe('module')
            expect(packageJson.scripts).toBeDefined()
            expect(packageJson.dependencies).toBeDefined()
            expect(packageJson.devDependencies).toBeDefined()
          })

          it('should have required @moluoxixi dependencies', async () => {
            const packageJson = await readPackageJson(projectDir)
            const allDeps = {
              ...packageJson.dependencies,
              ...packageJson.devDependencies,
            }

            // 基础必需依赖
            expect(allDeps['@moluoxixi/vite-config']).toBeDefined()
            expect(allDeps['@moluoxixi/ajax-package']).toBeDefined()

            // 根据配置检查 eslint
            if (testConfig.config.eslint) {
              expect(allDeps['@moluoxixi/eslint-config']).toBeDefined()
            }
          })
        })
      }
    })
  }

  // React 项目测试（如果有）
  if (reactConfigs.length > 0) {
    describe('react Projects', () => {
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

          it('should not have catalog references in package.json', async () => {
            const packageJson = await readPackageJson(projectDir)
            const catalogRefs = findCatalogReferences(packageJson)

            expect(catalogRefs).toEqual([])
          })

          it('should only import from own package (no cross-template imports)', async () => {
            const imports = await scanAllImports(projectDir)

            const crossTemplateImports = imports.filter(imp =>
              imp.includes('../../templates/')
              || imp.includes('../../../common/')
              || imp.includes('../../../vue/')
              || imp.includes('../../../react/'),
            )

            expect(crossTemplateImports).toEqual([])
          })

          it('should have valid package.json structure', async () => {
            const packageJson = await readPackageJson(projectDir)

            expect(packageJson.name).toBe(testConfig.config.projectName)
            expect(packageJson.description).toBe(testConfig.config.description)
            expect(packageJson.author).toBe(testConfig.config.author)
            expect(packageJson.type).toBe('module')
            expect(packageJson.scripts).toBeDefined()
            expect(packageJson.dependencies).toBeDefined()
            expect(packageJson.devDependencies).toBeDefined()
          })

          it('should have required @moluoxixi dependencies', async () => {
            const packageJson = await readPackageJson(projectDir)
            const allDeps = {
              ...packageJson.dependencies,
              ...packageJson.devDependencies,
            }

            expect(allDeps['@moluoxixi/vite-config']).toBeDefined()
            expect(allDeps['@moluoxixi/ajax-package']).toBeDefined()

            if (testConfig.config.eslint) {
              expect(allDeps['@moluoxixi/eslint-config']).toBeDefined()
            }
          })
        })
      }
    })
  }
})
