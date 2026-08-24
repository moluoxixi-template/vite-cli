/**
 * 模板展厅跨层数据契约。
 * full-matrix 导出、Pages 汇总和 gallery 前端共同消费这些字段。
 */

import type { ProjectConfigType } from '../types/index.ts'

export const TEMPLATE_GALLERY_SCHEMA_VERSION = 1 as const
export const DEFAULT_TEMPLATE_GALLERY_BASE_PATH = '/vite-cli/'

export type TemplateGalleryConfig = Omit<ProjectConfigType, 'targetDir'>

export interface TemplateArtifactUrls {
  demo: string
  download: string
  stackblitz: string
}

export interface TemplateArtifactSizes {
  demo: number
  sourceZip: number
  stackblitz: number
  total: number
}

export interface TemplateGalleryEntry {
  schemaVersion: typeof TEMPLATE_GALLERY_SCHEMA_VERSION
  slug: string
  name: string
  config: TemplateGalleryConfig
  urls: TemplateArtifactUrls
  sizes: TemplateArtifactSizes
  commit: string
}

export interface TemplateGalleryManifest {
  schemaVersion: typeof TEMPLATE_GALLERY_SCHEMA_VERSION
  commit: string
  generatedAt: string
  count: number
  entries: TemplateGalleryEntry[]
}

export interface StackBlitzProjectPayload {
  title: string
  description: string
  template: 'node'
  files: Record<string, string>
}

/**
 * 生成相对于 Pages 根目录的制品路径。
 * @param slug 矩阵组合公开标识
 * @returns 三类公开制品路径
 */
export function createTemplateArtifactUrls(slug: string): TemplateArtifactUrls {
  return {
    demo: `demos/${slug}/`,
    download: `downloads/vite-template-${slug}.zip`,
    stackblitz: `stackblitz/${slug}.json`,
  }
}

/**
 * 规范化 GitHub Pages 仓库根路径。
 * @param value 原始 base path
 * @returns 包含首尾斜杠的 base path
 */
export function normalizeTemplateGalleryBasePath(value: string): string {
  const segments = value.split('/').filter(Boolean)
  return segments.length === 0 ? '/' : `/${segments.join('/')}/`
}

/**
 * 生成 VITE_APP_CODE 使用的无首尾斜杠路径。
 * @param slug 矩阵组合公开标识
 * @param basePath Pages 仓库根路径
 * @returns Demo 对应 app code
 */
export function createTemplateDemoAppCode(
  slug: string,
  basePath = DEFAULT_TEMPLATE_GALLERY_BASE_PATH,
): string {
  const normalizedBase = normalizeTemplateGalleryBasePath(basePath)
  return `${normalizedBase.slice(1)}demos/${slug}`.replace(/\/$/, '')
}

/**
 * 校验并解析 Pages 发布的 manifest。
 * @param value fetch 得到的未知 JSON
 * @returns 类型化 manifest
 */
export function parseTemplateGalleryManifest(value: unknown): TemplateGalleryManifest {
  if (!isRecord(value)
    || value.schemaVersion !== TEMPLATE_GALLERY_SCHEMA_VERSION
    || typeof value.commit !== 'string'
    || typeof value.generatedAt !== 'string'
    || typeof value.count !== 'number'
    || !Array.isArray(value.entries)) {
    throw new TypeError('模板展厅 manifest 格式无效')
  }

  if (value.count !== value.entries.length || !value.entries.every(isTemplateGalleryEntry)) {
    throw new TypeError('模板展厅 manifest 条目不完整')
  }
  return value as unknown as TemplateGalleryManifest
}

/**
 * 校验单个 shard 导出的组合 metadata。
 * @param value metadata JSON
 * @returns 类型化展厅条目
 */
export function parseTemplateGalleryEntry(value: unknown): TemplateGalleryEntry {
  if (!isTemplateGalleryEntry(value)) {
    throw new TypeError('模板展厅 metadata 格式无效')
  }
  return value as unknown as TemplateGalleryEntry
}

/**
 * 校验 StackBlitz 懒加载项目数据。
 * @param value fetch 得到的未知 JSON
 * @returns 可交给 StackBlitz SDK 的项目
 */
export function parseStackBlitzProjectPayload(value: unknown): StackBlitzProjectPayload {
  if (!isRecord(value)
    || typeof value.title !== 'string'
    || typeof value.description !== 'string'
    || value.template !== 'node'
    || !isRecord(value.files)
    || !Object.values(value.files).every(file => typeof file === 'string')) {
    throw new TypeError('StackBlitz 项目数据格式无效')
  }
  return value as unknown as StackBlitzProjectPayload
}

function isTemplateGalleryEntry(value: unknown): boolean {
  if (!isRecord(value)
    || value.schemaVersion !== TEMPLATE_GALLERY_SCHEMA_VERSION
    || typeof value.slug !== 'string'
    || typeof value.name !== 'string'
    || typeof value.commit !== 'string'
    || !isRecord(value.config)
    || !isRecord(value.urls)
    || !isRecord(value.sizes)) {
    return false
  }

  return typeof value.urls.demo === 'string'
    && typeof value.urls.download === 'string'
    && typeof value.urls.stackblitz === 'string'
    && isValidSize(value.sizes.demo)
    && isValidSize(value.sizes.sourceZip)
    && isValidSize(value.sizes.stackblitz)
    && isValidSize(value.sizes.total)
    && value.sizes.total === value.sizes.demo + value.sizes.sourceZip + value.sizes.stackblitz
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidSize(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}
