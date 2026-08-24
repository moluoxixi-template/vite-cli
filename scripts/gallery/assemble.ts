import type { TemplateGalleryEntry, TemplateGalleryManifest } from '../../src/core/templateGallery.ts'

import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import fs from 'fs-extra'

import { createConfigMatrixSlug, generateConfigMatrix } from '../../src/core/configMatrix.ts'
import {
  createTemplateArtifactUrls,
  normalizeTemplateGalleryBasePath,
  parseStackBlitzProjectPayload,
  parseTemplateGalleryEntry,
  TEMPLATE_GALLERY_SCHEMA_VERSION,
} from '../../src/core/templateGallery.ts'

const DEFAULT_MAX_SITE_BYTES = 900 * 1024 * 1024

export interface AssembleGalleryOptions {
  artifactsDir: string
  galleryDistDir: string
  outputDir: string
  commit: string
  basePath: string
  expectedShards: number
  maxSiteBytes: number
  expectedSlugs?: string[]
}

export interface GallerySizeReport {
  demo: number
  downloads: number
  stackblitz: number
  gallery: number
  total: number
  largestEntry: { slug: string, bytes: number }
}

export async function assembleGallerySite(options: AssembleGalleryOptions): Promise<GallerySizeReport> {
  const expectedSlugs = new Set(options.expectedSlugs
    || generateConfigMatrix().map(entry => createConfigMatrixSlug(entry.config)))
  const expectedEntryCount = expectedSlugs.size
  const shardDirs = (await fs.readdir(options.artifactsDir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && /^template-gallery-shard-\d+$/.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }))

  if (shardDirs.length !== options.expectedShards) {
    throw new Error(`展厅 shard 数量错误: 预期 ${options.expectedShards}，实际 ${shardDirs.length}`)
  }

  const entries: TemplateGalleryEntry[] = []
  const entrySources = new Map<string, string>()
  for (const shardDir of shardDirs) {
    const entriesDir = path.join(options.artifactsDir, shardDir.name, 'entries')
    if (!await fs.pathExists(entriesDir)) {
      throw new Error(`展厅 shard 缺少 entries 目录: ${shardDir.name}`)
    }
    for (const slug of await fs.readdir(entriesDir)) {
      const sourceDir = path.join(entriesDir, slug)
      const metadata = parseTemplateGalleryEntry(await fs.readJson(path.join(sourceDir, 'metadata.json')))
      if (metadata.slug !== slug) {
        throw new Error(`展厅 metadata slug 与目录不一致: ${slug}`)
      }
      if (entrySources.has(slug)) {
        throw new Error(`展厅 slug 重复: ${slug}`)
      }
      entrySources.set(slug, sourceDir)
      entries.push(metadata)
    }
  }

  if (entries.length !== expectedEntryCount) {
    throw new Error(`展厅组合数量错误: 预期 ${expectedEntryCount}，实际 ${entries.length}`)
  }
  for (const entry of entries) {
    if (!expectedSlugs.delete(entry.slug)) {
      throw new Error(`展厅包含未知或重复组合: ${entry.slug}`)
    }
    if (entry.commit !== options.commit) {
      throw new Error(`展厅组合 commit 不一致: ${entry.slug}`)
    }
    const expectedUrls = createTemplateArtifactUrls(entry.slug)
    if (JSON.stringify(entry.urls) !== JSON.stringify(expectedUrls)) {
      throw new Error(`展厅组合 URL 契约不一致: ${entry.slug}`)
    }
  }
  if (expectedSlugs.size > 0) {
    throw new Error(`展厅缺少组合: ${Array.from(expectedSlugs).slice(0, 3).join(', ')}`)
  }

  await fs.emptyDir(options.outputDir)
  await fs.copy(options.galleryDistDir, options.outputDir)
  const basePath = normalizeTemplateGalleryBasePath(options.basePath)

  for (const entry of entries) {
    const sourceDir = entrySources.get(entry.slug)
    if (!sourceDir) {
      throw new Error(`展厅组合缺少来源目录: ${entry.slug}`)
    }
    const sourceDemoDir = path.join(sourceDir, 'demo')
    const sourceZipPath = path.join(sourceDir, 'source.zip')
    const sourceStackBlitzPath = path.join(sourceDir, 'stackblitz.json')
    await assertEntryArtifacts(entry.slug, sourceDemoDir, sourceZipPath, sourceStackBlitzPath)

    const demoDir = path.join(options.outputDir, 'demos', entry.slug)
    await fs.copy(sourceDemoDir, demoDir)
    await injectHistoryRestore(path.join(demoDir, 'index.html'), basePath, entry.slug)
    const outputZipPath = path.join(options.outputDir, ...entry.urls.download.split('/'))
    const outputStackBlitzPath = path.join(options.outputDir, ...entry.urls.stackblitz.split('/'))
    await fs.copy(
      sourceZipPath,
      outputZipPath,
    )
    await fs.copy(
      sourceStackBlitzPath,
      outputStackBlitzPath,
    )
    const demoSize = await directorySize(demoDir)
    const sourceZipSize = (await fs.stat(outputZipPath)).size
    const stackblitzSize = (await fs.stat(outputStackBlitzPath)).size
    entry.sizes = {
      demo: demoSize,
      sourceZip: sourceZipSize,
      stackblitz: stackblitzSize,
      total: demoSize + sourceZipSize + stackblitzSize,
    }
  }

  entries.sort((left, right) => left.slug.localeCompare(right.slug))
  const manifest: TemplateGalleryManifest = {
    schemaVersion: TEMPLATE_GALLERY_SCHEMA_VERSION,
    commit: options.commit,
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  }
  await fs.writeJson(path.join(options.outputDir, 'manifest.json'), manifest, { spaces: 2 })
  await fs.outputFile(path.join(options.outputDir, '404.html'), create404Html(basePath))
  await fs.outputFile(path.join(options.outputDir, '.nojekyll'), '')

  const report = await createSizeReport(options.outputDir, entries)
  if (report.total > options.maxSiteBytes) {
    throw new Error(`展厅总大小 ${formatBytes(report.total)} 超过限制 ${formatBytes(options.maxSiteBytes)}`)
  }
  return report
}

async function assertEntryArtifacts(
  slug: string,
  demoDir: string,
  zipPath: string,
  stackblitzPath: string,
): Promise<void> {
  const requiredPaths = [path.join(demoDir, 'index.html'), zipPath, stackblitzPath]
  for (const requiredPath of requiredPaths) {
    if (!await fs.pathExists(requiredPath)) {
      throw new Error(`展厅组合缺少制品 ${slug}: ${requiredPath}`)
    }
    const stat = await fs.stat(requiredPath)
    if (!stat.isFile() || stat.size === 0) {
      throw new Error(`展厅组合制品为空或类型错误 ${slug}: ${requiredPath}`)
    }
  }
  parseStackBlitzProjectPayload(await fs.readJson(stackblitzPath))
}

async function injectHistoryRestore(indexPath: string, basePath: string, slug: string): Promise<void> {
  const content = await fs.readFile(indexPath, 'utf-8')
  const demoRoot = `${basePath}demos/${slug}/`
  const script = `<script>(function(){var p=new URLSearchParams(location.search);var r=p.get('__gallery_redirect');if(!r)return;p.delete('__gallery_redirect');var q=p.toString();history.replaceState(null,'',${JSON.stringify(demoRoot)}+r+(q?'?'+q:'')+location.hash)})()</script>`
  await fs.writeFile(indexPath, content.replace('<head>', `<head>${script}`))
}

function create404Html(basePath: string): string {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>正在恢复页面</title></head><body><script>(function(){var base=${JSON.stringify(basePath)};var prefix=base+'demos/';var path=location.pathname;if(!path.startsWith(prefix)){location.replace(base);return}var rest=path.slice(prefix.length).split('/');var slug=rest.shift();if(!slug){location.replace(base);return}var route=rest.join('/');var target=prefix+slug+'/?__gallery_redirect='+encodeURIComponent(route);var query=location.search?('&'+location.search.slice(1)):'';location.replace(target+query+location.hash)})()</script></body></html>`
}

async function createSizeReport(
  outputDir: string,
  entries: TemplateGalleryEntry[],
): Promise<GallerySizeReport> {
  const demo = await directorySize(path.join(outputDir, 'demos'))
  const downloads = await directorySize(path.join(outputDir, 'downloads'))
  const stackblitz = await directorySize(path.join(outputDir, 'stackblitz'))
  const total = await directorySize(outputDir)
  const largestEntry = entries.reduce((largest, entry) => {
    return entry.sizes.total > largest.bytes
      ? { slug: entry.slug, bytes: entry.sizes.total }
      : largest
  }, { slug: '', bytes: 0 })
  return {
    demo,
    downloads,
    stackblitz,
    gallery: total - demo - downloads - stackblitz,
    total,
    largestEntry,
  }
}

async function directorySize(directoryPath: string): Promise<number> {
  if (!await fs.pathExists(directoryPath)) {
    return 0
  }
  let size = 0
  for (const entry of await fs.readdir(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name)
    size += entry.isDirectory() ? await directorySize(entryPath) : (await fs.stat(entryPath)).size
  }
  return size
}

function formatBytes(value: number): string {
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

async function main(): Promise<void> {
  const options: AssembleGalleryOptions = {
    artifactsDir: path.resolve(process.env.MATRIX_ARTIFACTS_DIR || '.gallery-shards'),
    galleryDistDir: path.resolve(process.env.GALLERY_DIST_DIR || 'gallery/dist'),
    outputDir: path.resolve(process.env.GALLERY_OUTPUT_DIR || '.gallery-site'),
    commit: process.env.GALLERY_COMMIT || '',
    basePath: process.env.GALLERY_BASE_PATH || '/vite-cli/',
    expectedShards: Number(process.env.GALLERY_EXPECTED_SHARDS || 12),
    maxSiteBytes: Number(process.env.GALLERY_MAX_BYTES || DEFAULT_MAX_SITE_BYTES),
  }
  if (!options.commit) {
    throw new TypeError('GALLERY_COMMIT 不能为空')
  }
  const report = await assembleGallerySite(options)
  console.log([
    `Gallery entries: ${generateConfigMatrix().length}`,
    `Demo: ${formatBytes(report.demo)}`,
    `Downloads: ${formatBytes(report.downloads)}`,
    `StackBlitz: ${formatBytes(report.stackblitz)}`,
    `Gallery shell: ${formatBytes(report.gallery)}`,
    `Total: ${formatBytes(report.total)}`,
    `Largest entry: ${report.largestEntry.slug} (${formatBytes(report.largestEntry.bytes)})`,
  ].join('\n'))
}

const executedFile = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedFile) {
  await main()
}
