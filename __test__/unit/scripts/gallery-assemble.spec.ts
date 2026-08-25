import path from 'node:path'
import { Buffer } from 'node:buffer'

import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { TemplateGalleryEntry } from '@/core/templateGallery'
import { createStackBlitzStartCommand } from '@/core/templateGallery'
import { assembleGallerySite } from '../../../scripts/gallery/assemble'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

let tempDir: string
let artifactsDir: string
let galleryDistDir: string
let outputDir: string

beforeEach(async () => {
  tempDir = await createTempDir('vite-cli-gallery-assemble-')
  artifactsDir = path.join(tempDir, 'artifacts')
  galleryDistDir = path.join(tempDir, 'gallery-dist')
  outputDir = path.join(tempDir, 'site')
})

afterEach(async () => {
  await cleanupTempDir(tempDir)
})

describe('gallery assembler', () => {
  it('汇总 shard 制品并生成单一 Pages 目录', async () => {
    const slug = 'v1-vue-element-plus-standard-pages-pnpm-i0-s0-e0-h0'
    const entryDir = path.join(artifactsDir, 'template-gallery-shard-0', 'entries', slug)
    const metadata = createMetadata(slug)
    await fs.outputFile(path.join(galleryDistDir, 'index.html'), '<main>Gallery</main>')
    await fs.outputFile(path.join(galleryDistDir, 'stackblitz.html'), '<main>StackBlitz</main>')
    await fs.outputFile(path.join(entryDir, 'demo', 'index.html'), '<html><head></head><body>Demo</body></html>')
    await fs.outputFile(path.join(entryDir, 'demo', 'assets', 'app.js'), 'console.log("demo")')
    await fs.outputFile(path.join(entryDir, 'source.zip'), 'zip-fixture')
    await fs.outputJson(path.join(entryDir, 'stackblitz.json'), {
      title: slug,
      description: 'fixture',
      template: 'node',
      files: {
        '.env.development': 'VITE_APP_ENV=development\n',
        '.env.production': 'VITE_APP_ENV=production\n',
        '.stackblitzrc': JSON.stringify({
          installDependencies: false,
          startCommand: createStackBlitzStartCommand(
            Buffer.from('VITE_APP_CODE=\nVITE_APP_TITLE=Fixture\n', 'utf-8').toString('base64'),
          ),
        }),
        'package.json': JSON.stringify({
          packageManager: 'pnpm@10.8.0',
          scripts: { dev: 'vite' },
          devDependencies: { sass: '^1.87.0' },
        }),
      },
    })
    await fs.outputJson(path.join(entryDir, 'metadata.json'), metadata)

    const report = await assembleGallerySite({
      artifactsDir,
      galleryDistDir,
      outputDir,
      commit: 'abc123',
      basePath: '/vite-cli/',
      expectedShards: 1,
      maxSiteBytes: 1024 * 1024,
      expectedSlugs: [slug],
    })

    expect(await fs.pathExists(path.join(outputDir, 'demos', slug, 'index.html'))).toBe(true)
    expect(await fs.pathExists(path.join(outputDir, 'downloads', `vite-template-${slug}.zip`))).toBe(true)
    expect(await fs.pathExists(path.join(outputDir, 'stackblitz', `${slug}.json`))).toBe(true)
    expect(await fs.pathExists(path.join(outputDir, '404.html'))).toBe(true)
    expect(await fs.pathExists(path.join(outputDir, '.nojekyll'))).toBe(true)
    const manifest = await fs.readJson(path.join(outputDir, 'manifest.json'))
    expect(manifest).toMatchObject({ count: 1 })
    expect(manifest.entries[0].sizes.demo).not.toBe(metadata.sizes.demo)
    expect(manifest.entries[0].sizes.total).toBe(
      manifest.entries[0].sizes.demo
      + manifest.entries[0].sizes.sourceZip
      + manifest.entries[0].sizes.stackblitz,
    )
    expect(await fs.readFile(path.join(outputDir, 'demos', slug, 'index.html'), 'utf-8'))
      .toContain('__gallery_redirect')
    expect(report.total).toBeGreaterThan(0)
  })

  it('拒绝缺少 shard 的不完整部署', async () => {
    await fs.ensureDir(artifactsDir)
    await fs.ensureDir(galleryDistDir)

    await expect(assembleGallerySite({
      artifactsDir,
      galleryDistDir,
      outputDir,
      commit: 'abc123',
      basePath: '/vite-cli/',
      expectedShards: 1,
      maxSiteBytes: 1024,
      expectedSlugs: [],
    })).rejects.toThrow('shard 数量错误')
  })
})

function createMetadata(slug: string): TemplateGalleryEntry {
  return {
    schemaVersion: 1,
    slug,
    name: slug,
    config: {
      projectName: slug,
      description: 'fixture',
      author: 'test',
      framework: 'vue',
      uiLibrary: 'element-plus',
      routeMode: 'pageRoutes',
      i18n: false,
      sentry: false,
      eslint: false,
      husky: false,
      microFrontend: false,
      packageManager: 'pnpm',
    },
    urls: {
      demo: `demos/${slug}/`,
      download: `downloads/vite-template-${slug}.zip`,
      stackblitz: `stackblitz/${slug}.json`,
    },
    sizes: { demo: 10, sourceZip: 10, stackblitz: 10, total: 30 },
    commit: 'abc123',
  }
}
