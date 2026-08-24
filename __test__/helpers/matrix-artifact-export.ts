import type { ProjectConfigType } from '@/types'
import type { TemplateGalleryEntry } from '@/core/templateGallery'
import type { TemplateSourceEntry } from '@/core/templateSource'

import os from 'node:os'
import path from 'node:path'

import compressing from 'compressing'
import fs from 'fs-extra'

import {
  createTemplateArtifactUrls,
  TEMPLATE_GALLERY_SCHEMA_VERSION,
} from '@/core/templateGallery'
import {
  collectTemplateSourceEntries,
  createStackBlitzProject,
} from '@/core/templateSource'

export {
  collectTemplateSourceEntries as collectSourceEntries,
  createStackBlitzProject,
} from '@/core/templateSource'

export interface ExportMatrixArtifactsOptions {
  projectDir: string
  exportRoot: string
  slug: string
  config: ProjectConfigType
  commit: string
}

/**
 * 导出单个已通过矩阵质量门禁的模板制品。
 * @param options 组合目录、配置和输出位置
 * @returns 可汇总到 Pages manifest 的 metadata
 */
export async function exportMatrixArtifacts(
  options: ExportMatrixArtifactsOptions,
): Promise<TemplateGalleryEntry> {
  const { projectDir, exportRoot, slug, config, commit } = options
  const entryDir = path.join(exportRoot, 'entries', slug)
  const demoDir = path.join(entryDir, 'demo')
  const zipPath = path.join(entryDir, 'source.zip')
  const stackblitzPath = path.join(entryDir, 'stackblitz.json')
  const metadataPath = path.join(entryDir, 'metadata.json')

  await fs.emptyDir(entryDir)
  const sourceEntries = await collectTemplateSourceEntries(projectDir)
  const demoSize = await copyDemoArtifact(path.join(projectDir, 'dist'), demoDir)
  const sourceZipSize = await createSourceZip(projectDir, zipPath, sourceEntries)
  const stackblitz = await createStackBlitzProject(projectDir, config, sourceEntries)
  await fs.writeJson(stackblitzPath, stackblitz, { spaces: 2 })
  const stackblitzSize = (await fs.stat(stackblitzPath)).size
  const { targetDir: _targetDir, ...publicConfig } = config
  void _targetDir

  const metadata: TemplateGalleryEntry = {
    schemaVersion: TEMPLATE_GALLERY_SCHEMA_VERSION,
    slug,
    name: config.projectName,
    config: publicConfig,
    urls: createTemplateArtifactUrls(slug),
    sizes: {
      demo: demoSize,
      sourceZip: sourceZipSize,
      stackblitz: stackblitzSize,
      total: demoSize + sourceZipSize + stackblitzSize,
    },
    commit,
  }

  await fs.writeJson(metadataPath, metadata, { spaces: 2 })
  return metadata
}

/**
 * 复制可部署的 Vite dist，并返回字节数。
 */
export async function copyDemoArtifact(distDir: string, demoDir: string): Promise<number> {
  if (!await fs.pathExists(path.join(distDir, 'index.html'))) {
    throw new Error(`Demo 构建产物缺少 index.html: ${distDir}`)
  }
  await fs.copy(distDir, demoDir)
  return getDirectorySize(demoDir)
}

/**
 * 创建不含安装与构建产物的源码 ZIP。
 */
export async function createSourceZip(
  projectDir: string,
  zipPath: string,
  entries?: TemplateSourceEntry[],
): Promise<number> {
  const sourceEntries = entries || await collectTemplateSourceEntries(projectDir)
  const stagingDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-cli-gallery-zip-'))
  try {
    for (const entry of sourceEntries) {
      const targetPath = path.join(stagingDir, ...entry.relativePath.split('/'))
      await fs.ensureDir(path.dirname(targetPath))
      await fs.copyFile(entry.absolutePath, targetPath)
    }
    await fs.ensureDir(path.dirname(zipPath))
    await compressing.zip.compressDir(stagingDir, zipPath, { ignoreBase: true })
    return (await fs.stat(zipPath)).size
  }
  finally {
    await fs.remove(stagingDir)
  }
}

async function getDirectorySize(directoryPath: string): Promise<number> {
  let size = 0
  for (const entry of await fs.readdir(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name)
    size += entry.isDirectory()
      ? await getDirectorySize(entryPath)
      : (await fs.stat(entryPath)).size
  }
  return size
}
