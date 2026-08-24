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
    expect(stackblitz.files).not.toHaveProperty('dist/index.html')
    expect(stackblitz.files).not.toHaveProperty('tsconfig.app.tsbuildinfo')
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
  })
  await fs.outputFile(path.join(rootDir, 'src', 'main.ts'), 'console.log("gallery")\n')
  await fs.outputFile(path.join(rootDir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n')
  await fs.outputFile(path.join(rootDir, '.env'), 'VITE_APP_CODE=app\n')
  await fs.outputFile(path.join(rootDir, '.husky', 'pre-commit'), 'pnpm lint\n')
  await fs.outputFile(path.join(rootDir, '.husky', '_', 'h'), 'generated\n')
  await fs.outputFile(path.join(rootDir, 'node_modules', 'pkg', 'index.js'), 'module.exports = {}\n')
  await fs.outputFile(path.join(rootDir, 'dist', 'index.html'), '<div id="app"></div>')
  await fs.outputFile(path.join(rootDir, 'dist', 'assets', 'app.js'), 'console.log("built")')
  await fs.outputFile(path.join(rootDir, 'debug.log'), 'debug')
  await fs.outputFile(path.join(rootDir, 'tsconfig.app.tsbuildinfo'), 'typescript cache')
}
