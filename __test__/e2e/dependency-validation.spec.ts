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
} from './dependency-validator'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

describe('e2e 依赖验证测试', () => {
  describe('目录引用解析', () => {
    it('应该在 Vue 项目中解析所有目录引用为实际版本', async () => {
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
    it.skip('应该在 React 项目中解析所有目录引用为实际版本', async () => {
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

  describe('条件依赖', () => {
    it('当禁用 eslint 时不应该有 ESLint 依赖', async () => {
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

    it('当禁用 i18n 时不应该有 i18n 依赖', async () => {
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

  describe('必需的基础依赖', () => {
    it('所有项目都应该有 @moluoxixi 依赖', async () => {
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
            '@moluoxixi/ajax-package',
          ],
          devRequired: [
            '@moluoxixi/vite-config',
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
