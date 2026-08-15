import path from 'node:path'

import { execa } from 'execa'
import fs from 'fs-extra'
import { describe, expect, it } from 'vitest'

import { generateProject } from '@/generators/project'
import type { PackageManagerType, ProjectConfigType } from '@/types'
import { cleanupTempDir, createTempDir } from '@test/test-utils'
import { generateTestConfigs } from './featureCombination/helpers/test-config-generator'

const ALL_CONFIGS = generateTestConfigs()
const MATRIX_CONFIGS = selectShard(ALL_CONFIGS)

describe.concurrent('全部合法组合可执行矩阵', () => {
  for (const testConfig of MATRIX_CONFIGS) {
    it(testConfig.name, async () => {
      const projectDir = await createTempDir(`vite-cli-matrix-${testConfig.config.framework}-`)
      const config: ProjectConfigType = {
        ...testConfig.config,
        targetDir: projectDir,
      }

      try {
        await generateProject(config)
        await verifyGeneratedContract(config)
        await runChecked(config.packageManager, getInstallArgs(config.packageManager), projectDir, 'install')
        await runScript(config.packageManager, 'type-check', projectDir)

        if (config.eslint) {
          await runScript(config.packageManager, 'lint:eslint', projectDir)
        }

        await runScript(config.packageManager, 'build', projectDir)
        await verifyBuildOutput(projectDir)
      }
      finally {
        await cleanupTempDir(projectDir)
      }
    })
  }
})

function selectShard<T>(configs: T[]): T[] {
  const shardCount = readPositiveInteger('MATRIX_SHARD_COUNT', 1)
  const shardIndex = readPositiveInteger('MATRIX_SHARD_INDEX', 0, true)

  if (shardIndex >= shardCount) {
    throw new Error(`MATRIX_SHARD_INDEX (${shardIndex}) 必须小于 MATRIX_SHARD_COUNT (${shardCount})`)
  }

  return configs.filter((_, index) => index % shardCount === shardIndex)
}

function readPositiveInteger(name: string, fallback: number, allowZero = false): number {
  const raw = process.env[name]
  if (raw === undefined) {
    return fallback
  }

  const value = Number(raw)
  const minimum = allowZero ? 0 : 1
  if (!Number.isInteger(value) || value < minimum) {
    throw new TypeError(`${name} 必须是大于等于 ${minimum} 的整数，实际为 ${raw}`)
  }
  return value
}

async function verifyGeneratedContract(config: ProjectConfigType): Promise<void> {
  const mainEntry = config.framework === 'vue' ? 'src/main.ts' : 'src/main.tsx'
  const otherMainEntry = config.framework === 'vue' ? 'src/main.tsx' : 'src/main.ts'
  const mainContent = await fs.readFile(path.join(config.targetDir, mainEntry), 'utf-8')
  const viteContent = await fs.readFile(path.join(config.targetDir, 'vite.config.ts'), 'utf-8')
  const packageJson = await fs.readJson(path.join(config.targetDir, 'package.json'))

  expect(await fs.pathExists(path.join(config.targetDir, otherMainEntry))).toBe(false)
  expect(await fs.pathExists(path.join(config.targetDir, 'src', 'main'))).toBe(false)
  expect(await fs.pathExists(path.join(config.targetDir, 'vite'))).toBe(false)
  expect(viteContent).not.toContain('@moluoxixi/vite-config')
  expect(packageJson.dependencies).toHaveProperty('@moluoxixi/ajax-package', '0.0.60')
  expect(packageJson.dependencies).not.toHaveProperty('@moluoxixi/class-names')

  const expectedUiDependency = config.framework === 'vue' ? 'element-plus' : 'antd'
  const unexpectedUiDependency = config.framework === 'vue' ? 'antd' : 'element-plus'
  const expectedStateDependency = config.framework === 'vue' ? 'pinia' : 'zustand'
  const unexpectedStateDependency = config.framework === 'vue' ? 'zustand' : 'pinia'
  const expectedFrameworkPlugin = config.framework === 'vue' ? '@vitejs/plugin-vue' : '@vitejs/plugin-react'
  const unexpectedFrameworkPlugin = config.framework === 'vue' ? '@vitejs/plugin-react' : '@vitejs/plugin-vue'
  expect(packageJson.dependencies).toHaveProperty(expectedUiDependency)
  expect(packageJson.dependencies).not.toHaveProperty(unexpectedUiDependency)
  expect(packageJson.dependencies).toHaveProperty(expectedStateDependency)
  expect(packageJson.dependencies).not.toHaveProperty(unexpectedStateDependency)
  expect(packageJson.devDependencies).toHaveProperty(expectedFrameworkPlugin)
  expect(packageJson.devDependencies).not.toHaveProperty(unexpectedFrameworkPlugin)
  expect(Boolean(packageJson.devDependencies?.['vite-plugin-pages']))
    .toBe(config.routeMode === 'pageRoutes')

  if (config.microFrontend) {
    expect(mainContent).toContain('renderWithQiankun')
    expect(viteContent).toContain('vite-plugin-qiankun')
    expect(packageJson.dependencies).toHaveProperty('vite-plugin-qiankun')
  }
  else {
    expect(mainContent).not.toContain('renderWithQiankun')
    expect(mainContent).not.toContain('__POWERED_BY_QIANKUN__')
    expect(viteContent).not.toContain('vite-plugin-qiankun')
    expect(packageJson.dependencies).not.toHaveProperty('vite-plugin-qiankun')
  }

  const expectedI18nDependency = config.framework === 'vue' ? 'vue-i18n' : 'react-i18next'
  const unexpectedI18nDependency = config.framework === 'vue' ? 'react-i18next' : 'vue-i18n'
  const expectedSentryDependency = config.framework === 'vue' ? '@sentry/vue' : '@sentry/react'
  const unexpectedSentryDependency = config.framework === 'vue' ? '@sentry/react' : '@sentry/vue'
  expect(Boolean(packageJson.dependencies?.[expectedI18nDependency])).toBe(config.i18n)
  expect(packageJson.dependencies).not.toHaveProperty(unexpectedI18nDependency)
  expect(Boolean(packageJson.dependencies?.[expectedSentryDependency])).toBe(config.sentry)
  expect(packageJson.dependencies).not.toHaveProperty(unexpectedSentryDependency)
  expect(Boolean(packageJson.devDependencies?.['@moluoxixi/eslint-config']))
    .toBe(config.eslint)
  expect(Boolean(packageJson.devDependencies?.husky))
    .toBe(config.husky)

  const preCommitPath = path.join(config.targetDir, '.husky', 'pre-commit')
  expect(await fs.pathExists(preCommitPath)).toBe(config.husky)
  if (config.husky) {
    expect(await fs.readFile(preCommitPath, 'utf-8')).toContain('[ -x node_modules/.bin/eslint ]')
  }
}

async function verifyBuildOutput(projectDir: string): Promise<void> {
  const distDir = path.join(projectDir, 'dist')
  const indexPath = path.join(distDir, 'index.html')
  expect(await fs.pathExists(indexPath)).toBe(true)
  expect(await fs.readFile(indexPath, 'utf-8')).toMatch(/\/app\/assets\/[^"']+\.js/)

  const assetFiles = await fs.readdir(path.join(distDir, 'assets'))
  expect(assetFiles.some(file => /\.(?:css|js)$/.test(file))).toBe(true)
}

function getInstallArgs(packageManager: PackageManagerType): string[] {
  if (packageManager === 'pnpm') {
    return ['install', '--prefer-offline']
  }
  if (packageManager === 'npm') {
    // npm's offline metadata can lag the registry and resolve a valid range
    // to a version that no longer exists. Matrix installs must validate the
    // package-manager path against current registry metadata.
    return ['install', '--prefer-online', '--no-audit', '--no-fund']
  }
  return ['install', '--prefer-offline', '--ignore-engines']
}

async function runScript(
  packageManager: PackageManagerType,
  script: string,
  cwd: string,
): Promise<void> {
  const args = packageManager === 'npm' ? ['run', script] : [script]
  await runChecked(packageManager, args, cwd, script)
}

async function runChecked(
  command: string,
  args: string[],
  cwd: string,
  label: string,
): Promise<void> {
  const result = await execa(command, args, {
    cwd,
    reject: false,
    env: {
      ...process.env,
      CI: 'true',
    },
  })

  expect(
    result.exitCode,
    `${label} 失败 (${command} ${args.join(' ')})\n${result.stdout}\n${result.stderr}`,
  ).toBe(0)
}
