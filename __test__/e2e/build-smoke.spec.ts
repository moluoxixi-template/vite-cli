import path from 'node:path'

import { execa } from 'execa'
import fs from 'fs-extra'
import { afterEach, describe, expect, it } from 'vitest'

import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

const generatedDirs: string[] = []
const CASES: Array<{
  name: string
  prefix: string
  overrides: Partial<ProjectConfigType>
}> = [
  {
    name: 'Vue manualRoutes 标准项目',
    prefix: 'vue-standard-manual',
    overrides: { routeMode: 'manualRoutes' },
  },
  {
    name: 'Vue pageRoutes 标准项目',
    prefix: 'vue-standard-pages',
    overrides: { routeMode: 'pageRoutes' },
  },
  {
    name: 'Vue manualRoutes qiankun 项目',
    prefix: 'vue-qiankun-manual',
    overrides: { routeMode: 'manualRoutes', microFrontend: true, microFrontendEngine: 'qiankun' },
  },
  {
    name: 'Vue pageRoutes qiankun 项目',
    prefix: 'vue-qiankun-pages',
    overrides: { routeMode: 'pageRoutes', microFrontend: true, microFrontendEngine: 'qiankun' },
  },
  {
    name: 'React manualRoutes 标准项目',
    prefix: 'react-standard-manual',
    overrides: { framework: 'react', uiLibrary: 'ant-design', routeMode: 'manualRoutes' },
  },
  {
    name: 'React pageRoutes 标准项目',
    prefix: 'react-standard-pages',
    overrides: { framework: 'react', uiLibrary: 'ant-design', routeMode: 'pageRoutes' },
  },
  {
    name: 'React manualRoutes qiankun 项目',
    prefix: 'react-qiankun-manual',
    overrides: {
      framework: 'react',
      uiLibrary: 'ant-design',
      routeMode: 'manualRoutes',
      microFrontend: true,
      microFrontendEngine: 'qiankun',
    },
  },
  {
    name: 'React pageRoutes qiankun 项目',
    prefix: 'react-qiankun-pages',
    overrides: {
      framework: 'react',
      uiLibrary: 'ant-design',
      routeMode: 'pageRoutes',
      microFrontend: true,
      microFrontendEngine: 'qiankun',
    },
  },
]

function createConfig(targetDir: string, overrides: Partial<ProjectConfigType>): ProjectConfigType {
  return {
    projectName: 'build-smoke',
    description: 'Generated project build smoke',
    author: 'test',
    framework: 'vue',
    uiLibrary: 'element-plus',
    routeMode: 'pageRoutes',
    i18n: false,
    microFrontend: false,
    sentry: false,
    eslint: false,
    husky: false,
    packageManager: 'pnpm',
    targetDir,
    ...overrides,
  }
}

async function expectGeneratedProjectToBuild(config: ProjectConfigType): Promise<void> {
  await generateProject(config)

  // Intentionally resolve current semver ranges: this gate detects upstream plugin drift.
  const install = await execa('pnpm', ['install', '--prefer-offline'], {
    cwd: config.targetDir,
    reject: false,
  })
  expect(install.exitCode, install.stderr).toBe(0)

  const typeCheck = await execa('pnpm', ['type-check'], {
    cwd: config.targetDir,
    reject: false,
  })
  expect(typeCheck.exitCode, `${typeCheck.stdout}\n${typeCheck.stderr}`).toBe(0)

  const build = await execa('pnpm', ['build'], {
    cwd: config.targetDir,
    reject: false,
  })
  expect(build.exitCode, `${build.stdout}\n${build.stderr}`).toBe(0)
  expect(await fs.pathExists(path.join(config.targetDir, 'dist', 'index.html'))).toBe(true)
}

afterEach(async () => {
  await Promise.all(generatedDirs.splice(0).map(cleanupTempDir))
})

describe.sequential('生成项目 build smoke', () => {
  for (const testCase of CASES) {
    it(`构建 ${testCase.name}`, async () => {
      const targetDir = await createTempDir(`vite-cli-build-${testCase.prefix}-`)
      generatedDirs.push(targetDir)

      await expectGeneratedProjectToBuild(createConfig(targetDir, {
        projectName: `build-smoke-${testCase.prefix}`,
        ...testCase.overrides,
      }))
    })
  }
})
