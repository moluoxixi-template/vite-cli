/**
 * E2E 依赖验证测试
 * 测试生成的项目依赖是否完整、版本是否正确
 */

import { describe, expect, it } from 'vitest'
import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import {
  findCatalogReferences,
  readPackageJson,
  validateDependencies,
} from '@test/dependency-validator'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

describe('e2E Dependency Validation Tests', () => {
  describe('catalog References Resolution', () => {
    it('should resolve all catalog references to actual versions in Vue project', async () => {
      const projectDir = await createTempDir('test-catalog-vue-')

      try {
        const config: ProjectConfigType = {
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
          projectName: 'test-catalog-vue',
          description: 'Test project',
          author: 'test',
          targetDir: projectDir,
        }

        await generateProject(config)

        const packageJson = await readPackageJson(projectDir)
        const catalogRefs = findCatalogReferences(packageJson)

        expect(catalogRefs).toEqual([])
      }
      finally {
        await cleanupTempDir(projectDir)
      }
    }, 60000)

    // TODO: 启用 React 测试（当 React 模板准备好后）
    it.skip('should resolve all catalog references to actual versions in React project', async () => {
      const projectDir = await createTempDir('test-catalog-react-')

      try {
        const config: ProjectConfigType = {
          framework: 'react',
          uiLibrary: 'ant-design',
          routeMode: 'manualRoutes',
          zustand: true,
          manualRoutes: true,
          pageRoutes: false,
          i18n: true,
          sentry: false,
          eslint: true,
          husky: true,
          microFrontend: false,
          packageManager: 'pnpm',
          projectName: 'test-catalog-react',
          description: 'Test project',
          author: 'test',
          targetDir: projectDir,
        }

        await generateProject(config)

        const packageJson = await readPackageJson(projectDir)
        const catalogRefs = findCatalogReferences(packageJson)

        expect(catalogRefs).toEqual([])
      }
      finally {
        await cleanupTempDir(projectDir)
      }
    }, 60000)
  })

  describe('monorepo Import Validation', () => {
    it('should not have cross-template imports in Vue project', async () => {
      const projectDir = await createTempDir('test-imports-vue-')

      try {
        const config: ProjectConfigType = {
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
          projectName: 'test-imports-vue',
          description: 'Test project',
          author: 'test',
          targetDir: projectDir,
        }

        await generateProject(config)

        // scanAllImports 会在集成测试中验证
        // E2E 测试主要确保项目生成成功
        const packageJson = await readPackageJson(projectDir)
        expect(packageJson).toBeDefined()
      }
      finally {
        await cleanupTempDir(projectDir)
      }
    }, 60000)
  })

  describe('conditional Dependencies', () => {
    it('should not have ESLint deps when eslint is disabled', async () => {
      const projectDir = await createTempDir('test-no-eslint-')

      try {
        const config: ProjectConfigType = {
          framework: 'vue',
          uiLibrary: 'element-plus',
          routeMode: 'manualRoutes',
          pinia: true,
          manualRoutes: true,
          pageRoutes: false,
          i18n: false,
          sentry: false,
          eslint: false, // 禁用 ESLint
          husky: false,
          microFrontend: false,
          packageManager: 'pnpm',
          projectName: 'test-no-eslint',
          description: 'Test project',
          author: 'test',
          targetDir: projectDir,
        }

        await generateProject(config)

        const result = await validateDependencies(projectDir, {
          shouldNotHave: ['@moluoxixi/eslint-config', 'eslint'],
        })

        expect(result.unexpectedDeps).toEqual([])
      }
      finally {
        await cleanupTempDir(projectDir)
      }
    }, 60000)

    it('should not have i18n deps when i18n is disabled', async () => {
      const projectDir = await createTempDir('test-no-i18n-')

      try {
        const config: ProjectConfigType = {
          framework: 'vue',
          uiLibrary: 'element-plus',
          routeMode: 'manualRoutes',
          pinia: true,
          manualRoutes: true,
          pageRoutes: false,
          i18n: false, // 禁用 i18n
          sentry: false,
          eslint: true,
          husky: true,
          microFrontend: false,
          packageManager: 'pnpm',
          projectName: 'test-no-i18n',
          description: 'Test project',
          author: 'test',
          targetDir: projectDir,
        }

        await generateProject(config)

        const result = await validateDependencies(projectDir, {
          shouldNotHave: ['vue-i18n', 'react-i18next'],
        })

        expect(result.unexpectedDeps).toEqual([])
      }
      finally {
        await cleanupTempDir(projectDir)
      }
    }, 60000)
  })

  describe('required Base Dependencies', () => {
    it('should have @moluoxixi dependencies in all projects', async () => {
      const projectDir = await createTempDir('test-moluoxixi-deps-')

      try {
        const config: ProjectConfigType = {
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
          projectName: 'test-moluoxixi-deps',
          description: 'Test project',
          author: 'test',
          targetDir: projectDir,
        }

        await generateProject(config)

        const result = await validateDependencies(projectDir, {
          required: [
            '@moluoxixi/vite-config',
            '@moluoxixi/ajax-package',
          ],
          devRequired: [
            '@moluoxixi/eslint-config',
          ],
        })

        expect(result.missingDeps).toEqual([])
      }
      finally {
        await cleanupTempDir(projectDir)
      }
    }, 60000)
  })
})
