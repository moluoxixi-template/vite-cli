import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { execa } from 'execa'
import fs from 'fs-extra'
import { describe, expect, it } from 'vitest'

import { generateProject } from '@/generators/project'
import type { PackageManagerType, ProjectConfigType } from '@/types'
import {
  cleanupTempDir,
  createTempDir,
  TRANSPARENT_AJAX_SOURCE_FILES,
} from '@test/test-utils'
import { generateTestConfigs } from './featureCombination/helpers/test-config-generator'

const ALL_CONFIGS = generateTestConfigs()
const MATRIX_CONFIGS = selectShard(ALL_CONFIGS)
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

describe.concurrent('全部合法组合可执行矩阵', () => {
  for (const testConfig of MATRIX_CONFIGS) {
    // 完整模板安装与质量检查不设时限，必须等待每个组合给出确定结果。
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
        else {
          await runGeneratedSourceLint(projectDir)
        }

        await runScript(config.packageManager, 'build', projectDir)
        await verifyBuildOutput(projectDir)
      }
      finally {
        await cleanupTempDir(projectDir)
      }
    }, 0)
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
  const requestContent = await fs.readFile(path.join(config.targetDir, 'src/apis/request.ts'), 'utf-8')
  const packageJson = await fs.readJson(path.join(config.targetDir, 'package.json'))

  expect(await fs.pathExists(path.join(config.targetDir, otherMainEntry))).toBe(false)
  expect(await fs.pathExists(path.join(config.targetDir, 'src', 'main'))).toBe(false)
  expect(await fs.pathExists(path.join(config.targetDir, 'vite'))).toBe(false)
  expect(viteContent).toContain('import { fileURLToPath, URL } from \'node:url\'')
  expect(viteContent).not.toContain('import F{')
  expect(viteContent).not.toContain('@moluoxixi/vite-config')
  expect(packageJson.dependencies).toHaveProperty('axios', '^1.16.1')
  expect(packageJson.dependencies).not.toHaveProperty('@moluoxixi/ajax-package')
  expect(packageJson.dependencies).not.toHaveProperty('@moluoxixi/class-names')
  expect(requestContent).toContain('from \'./ajax\'')
  expect(requestContent).not.toContain('@moluoxixi/ajax-package')
  for (const fileName of TRANSPARENT_AJAX_SOURCE_FILES) {
    expect(await fs.pathExists(path.join(config.targetDir, 'src/apis/ajax', fileName))).toBe(true)
  }

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
  expect(packageJson.devDependencies).not.toHaveProperty('eslint-plugin-vue')
  expect(packageJson.devDependencies).not.toHaveProperty('@antfu/eslint-config')
  expect(Boolean(packageJson.devDependencies?.['@eslint-react/eslint-plugin']))
    .toBe(config.eslint && config.framework === 'react')
  expect(Boolean(packageJson.devDependencies?.['eslint-plugin-react-refresh']))
    .toBe(config.eslint && config.framework === 'react')
  expect(Boolean(packageJson.scripts?.['lint:eslint'])).toBe(config.eslint)

  const eslintConfigPath = path.join(config.targetDir, 'eslint.config.ts')
  expect(await fs.pathExists(eslintConfigPath)).toBe(config.eslint)
  if (config.eslint) {
    const eslintConfig = await fs.readFile(eslintConfigPath, 'utf-8')
    expect(eslintConfig).toContain('from \'@moluoxixi/eslint-config\'')
    expect(eslintConfig).not.toContain('vue:')
    expect(eslintConfig).not.toContain('react:')
    expect(eslintConfig).not.toContain('formatters:')
    expect(eslintConfig).not.toContain(".removeRules('vue/block-order')")
    expect(eslintConfig).not.toContain('typescript:')
    expect(eslintConfig).not.toContain('eslint-plugin-vue')
    if (config.framework === 'react') {
      expect(packageJson.devDependencies).toHaveProperty('@eslint-react/eslint-plugin', '^3.0.0')
      expect(packageJson.devDependencies).toHaveProperty('eslint-plugin-react-refresh', '^0.5.0')
    }
    else {
      expect(packageJson.devDependencies).not.toHaveProperty('@eslint-react/eslint-plugin')
      expect(packageJson.devDependencies).not.toHaveProperty('eslint-plugin-react-refresh')
    }
  }

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

/**
 * Lint projects that intentionally omit the optional ESLint feature with the
 * repository's shared config. Their generated package stays minimal, while
 * every legal matrix combination still receives a source-quality gate.
 */
async function runGeneratedSourceLint(projectDir: string): Promise<void> {
  const candidates = [
    path.join(projectDir, 'src'),
    path.join(projectDir, 'scripts'),
    path.join(projectDir, 'vite.config.ts'),
    path.join(projectDir, 'env.d.ts'),
  ]
  const lintPaths: string[] = []

  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      lintPaths.push(...await collectLintFiles(candidate))
    }
  }

  expect(lintPaths.length).toBeGreaterThan(0)
  await runChecked(
    'eslint',
    [
      '--config',
      path.join(repositoryRoot, 'eslint.config.ts'),
      '--no-ignore',
      '--no-warn-ignored',
      ...lintPaths,
    ],
    repositoryRoot,
    'shared generated-source lint',
  )
}

async function collectLintFiles(inputPath: string): Promise<string[]> {
  const stat = await fs.stat(inputPath)
  if (stat.isFile()) {
    return [inputPath]
  }

  const files: string[] = []
  for (const entry of await fs.readdir(inputPath, { withFileTypes: true })) {
    const entryPath = path.join(inputPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectLintFiles(entryPath))
    }
    else if (entry.isFile() && /\.(?:[cm]?[jt]sx?|vue)$/.test(entry.name)) {
      files.push(entryPath)
    }
  }
  return files
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
