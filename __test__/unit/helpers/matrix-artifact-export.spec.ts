import { Buffer } from 'node:buffer'
import path from 'node:path'

import compressing from 'compressing'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ProjectConfigType } from '@/types'
import {
  collectSourceEntries,
  createStackBlitzProject,
  exportMatrixArtifacts,
} from '@test/matrix-artifact-export'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

let tempDir: string
let projectDir: string
let exportRoot: string

beforeEach(async () => {
  tempDir = await createTempDir('vite-cli-gallery-export-')
  projectDir = path.join(tempDir, 'project')
  exportRoot = path.join(tempDir, 'export')
  await seedProject(projectDir)
})

afterEach(async () => {
  await cleanupTempDir(tempDir)
})

describe('matrix artifact export', () => {
  it('从同一源码集合导出 Demo、ZIP、StackBlitz 和 metadata', async () => {
    const config = createConfig(projectDir)
    const metadata = await exportMatrixArtifacts({
      projectDir,
      exportRoot,
      slug: 'v1-vue-element-plus-standard-pages-pnpm-i1-s0-e1-h1',
      config,
      commit: 'abc123',
    })

    const entryDir = path.join(exportRoot, 'entries', metadata.slug)
    const extractedDir = path.join(tempDir, 'extracted')
    await compressing.zip.uncompress(path.join(entryDir, 'source.zip'), extractedDir)

    expect(await fs.pathExists(path.join(entryDir, 'demo', 'index.html'))).toBe(true)
    expect(await fs.pathExists(path.join(extractedDir, 'src', 'main.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(extractedDir, 'pnpm-lock.yaml'))).toBe(true)
    expect(await fs.pathExists(path.join(extractedDir, '.env'))).toBe(true)
    expect(await fs.pathExists(path.join(extractedDir, '.husky', 'pre-commit'))).toBe(true)
    expect(await fs.pathExists(path.join(extractedDir, 'node_modules'))).toBe(false)
    expect(await fs.pathExists(path.join(extractedDir, 'dist'))).toBe(false)
    expect(await fs.pathExists(path.join(extractedDir, '.husky', '_'))).toBe(false)
    expect(await fs.pathExists(path.join(extractedDir, 'debug.log'))).toBe(false)
    expect(await fs.pathExists(path.join(extractedDir, 'tsconfig.app.tsbuildinfo'))).toBe(false)

    const stackblitz = await fs.readJson(path.join(entryDir, 'stackblitz.json'))
    expect(stackblitz.template).toBe('node')
    expect(stackblitz.files).toHaveProperty('src/main.ts')
    expect(stackblitz.files).not.toHaveProperty('pnpm-lock.yaml')
    expect(stackblitz.files).not.toHaveProperty('.env')
    expect(stackblitz.files).not.toHaveProperty('dist/index.html')
    expect(stackblitz.files).not.toHaveProperty('tsconfig.app.tsbuildinfo')
    expect(stackblitz.files['.env.development']).toBe('VITE_APP_ENV=development\n')
    expect(stackblitz.files['.env.production']).toBe('VITE_APP_ENV=production\n')
    const stackblitzConfig = JSON.parse(stackblitz.files['.stackblitzrc'])
    expect(stackblitzConfig.installDependencies).toBe(false)
    expect(stackblitzConfig.startCommand).toContain(' > .stackblitz-env.b64 && node -e ')
    expect(stackblitzConfig.startCommand).toContain(' && pnpm install --no-frozen-lockfile && pnpm run dev')
    expect(readInjectedEnvironment(stackblitzConfig.startCommand)).toContain('VITE_APP_CODE=')
    expect(readInjectedEnvironment(stackblitzConfig.startCommand)).toContain('VITE_APP_TITLE=Fixture')
    expect(JSON.parse(stackblitz.files['package.json'])).toMatchObject({
      packageManager: 'pnpm@10.8.0',
      scripts: { dev: 'vite' },
    })
    expect(JSON.parse(stackblitz.files['package.json']).devDependencies).toEqual({
      sass: '^1.87.0',
    })
    expect(metadata.config).not.toHaveProperty('targetDir')
    expect(metadata.urls.demo).toBe(`demos/${metadata.slug}/`)
    expect(metadata.urls.download).toBe(`downloads/vite-template-${metadata.slug}.zip`)
    expect(metadata.sizes.total).toBeGreaterThan(0)
  })

  it('拒绝 StackBlitz 无法表示的二进制源码', async () => {
    const binaryPath = path.join(projectDir, 'src', 'binary.dat')
    await fs.writeFile(binaryPath, Buffer.from([0xC3, 0x28]))
    const entries = await collectSourceEntries(projectDir)

    await expect(
      createStackBlitzProject(projectDir, createConfig(projectDir), entries),
    ).rejects.toThrow('src/binary.dat')
  })

  it('把根 env 合并到 mode env 并归一化 app code', async () => {
    await fs.outputFile(path.join(projectDir, '.env'), [
      'VITE_APP_CODE=legacy',
      'VITE_APP_TITLE=Fixture',
      'VITE_APP_CODE=app',
    ].join('\n'))

    const stackblitz = await createStackBlitzProject(projectDir, createConfig(projectDir))

    expect(stackblitz.files).not.toHaveProperty('.env')
    expect(stackblitz.files['.env.development']).toBe('VITE_APP_ENV=development\n')
    expect(stackblitz.files['.env.production']).toBe('VITE_APP_ENV=production\n')
    const injectedEnvironment = readInjectedEnvironment(
      JSON.parse(stackblitz.files['.stackblitzrc']).startCommand,
    )
    expect(injectedEnvironment.match(/^VITE_APP_CODE=.*$/gm)).toEqual(['VITE_APP_CODE='])
    expect(injectedEnvironment.match(/^VITE_APP_TITLE=.*$/gm)).toEqual(['VITE_APP_TITLE=Fixture'])
  })

  it('为 qiankun 载荷启用独立预览', async () => {
    await fs.outputFile(path.join(projectDir, 'vite.config.ts'), 'import qiankun from \'vite-plugin-qiankun\'\n')
    const config = createConfig(projectDir)
    config.microFrontend = true
    config.microFrontendEngine = 'qiankun'

    const stackblitz = await createStackBlitzProject(projectDir, config)

    expect(stackblitz.files['.env.development']).toBe('VITE_APP_ENV=development\n')
    expect(stackblitz.files['.env.production']).toBe('VITE_APP_ENV=production\n')
    const injectedEnvironment = readInjectedEnvironment(
      JSON.parse(stackblitz.files['.stackblitzrc']).startCommand,
    )
    expect(injectedEnvironment.match(/^VITE_STANDALONE=.*$/gm)).toEqual(['VITE_STANDALONE=true'])
  })

  it.each(['npm', 'pnpm', 'yarn'] as const)('把 %s 组合的 StackBlitz 运行时统一为 pnpm', async (packageManager) => {
    const config = createConfig(projectDir)
    config.packageManager = packageManager

    const stackblitz = await createStackBlitzProject(projectDir, config)

    expect(JSON.parse(stackblitz.files['package.json']).packageManager).toBe('pnpm@10.8.0')
    const stackblitzConfig = JSON.parse(stackblitz.files['.stackblitzrc'])
    expect(stackblitzConfig.installDependencies).toBe(false)
    expect(stackblitzConfig.startCommand).toMatch(/^echo [a-z0-9+/]+={0,2} > \.stackblitz-env\.b64 && node -e /i)
  })

  it('稳定排序源码路径并排除安装与构建目录', async () => {
    const entries = await collectSourceEntries(projectDir)
    const paths = entries.map(entry => entry.relativePath)

    expect(paths).toEqual([...paths].sort((left, right) => left.localeCompare(right)))
    expect(paths).toContain('package.json')
    expect(paths).toContain('src/main.ts')
    expect(paths.some(file => file.startsWith('node_modules/'))).toBe(false)
    expect(paths.some(file => file.startsWith('dist/'))).toBe(false)
  })
})

function createConfig(targetDir: string): ProjectConfigType {
  return {
    projectName: 'gallery-export',
    description: 'Gallery export fixture',
    author: 'test',
    framework: 'vue',
    uiLibrary: 'element-plus',
    routeMode: 'pageRoutes',
    i18n: true,
    sentry: false,
    eslint: true,
    husky: true,
    microFrontend: false,
    packageManager: 'pnpm',
    targetDir,
  }
}

async function seedProject(rootDir: string): Promise<void> {
  await fs.outputJson(path.join(rootDir, 'package.json'), {
    name: 'gallery-export',
    scripts: { dev: 'vite' },
    dependencies: { vue: '^3.5.0' },
    devDependencies: {
      'sass': '^1.87.0',
      'sass-embedded': '^1.87.0',
    },
  })
  await fs.outputFile(path.join(rootDir, 'src', 'main.ts'), 'console.log("gallery")\n')
  await fs.outputFile(path.join(rootDir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n')
  await fs.outputFile(path.join(rootDir, '.env'), [
    'VITE_APP_CODE=app',
    'VITE_APP_TITLE=Fixture',
    'VITE_APP_PORT=3000',
  ].join('\n'))
  await fs.outputFile(path.join(rootDir, '.env.development'), 'VITE_APP_ENV=development\n')
  await fs.outputFile(path.join(rootDir, '.env.production'), 'VITE_APP_ENV=production\n')
  await fs.outputFile(path.join(rootDir, '.husky', 'pre-commit'), 'pnpm lint\n')
  await fs.outputFile(path.join(rootDir, '.husky', '_', 'h'), 'generated\n')
  await fs.outputFile(path.join(rootDir, 'node_modules', 'pkg', 'index.js'), 'module.exports = {}\n')
  await fs.outputFile(path.join(rootDir, 'dist', 'index.html'), '<div id="app"></div>')
  await fs.outputFile(path.join(rootDir, 'dist', 'assets', 'app.js'), 'console.log("built")')
  await fs.outputFile(path.join(rootDir, 'debug.log'), 'debug')
  await fs.outputFile(path.join(rootDir, 'tsconfig.app.tsbuildinfo'), 'typescript cache')
}

function readInjectedEnvironment(startCommand: string): string {
  const encoded = /^echo ([a-z0-9+/]+={0,2}) > \.stackblitz-env\.b64 &&/i.exec(startCommand)?.[1]
  if (!encoded) {
    throw new Error('StackBlitz startCommand 缺少 env echo 注入')
  }
  return Buffer.from(encoded, 'base64').toString('utf-8')
}
