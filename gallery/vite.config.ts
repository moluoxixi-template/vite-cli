import type { Plugin } from 'vite'
import type { ConfigMatrixEntry } from '../src/core/configMatrix.ts'
import type { StackBlitzProjectPayload } from '../src/core/templateGallery.ts'

import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { mkdtemp, rm } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

import { createConfigMatrixSlug, generateConfigMatrix } from '../src/core/configMatrix.ts'
import {
  createTemplateArtifactUrls,
  TEMPLATE_GALLERY_SCHEMA_VERSION,
} from '../src/core/templateGallery.ts'
import { createStackBlitzProject } from '../src/core/templateSource.ts'
import { generateProject } from '../src/generators/project.ts'

const galleryRoot = fileURLToPath(new URL('.', import.meta.url))
const configMatrix = generateConfigMatrix()
const matrixEntriesBySlug = new Map(
  configMatrix.map(entry => [createConfigMatrixSlug(entry.config), entry]),
)
const developmentStackBlitzCache = new Map<string, Promise<StackBlitzProjectPayload>>()

export default defineConfig({
  base: process.env.GALLERY_BASE_PATH || '/vite-cli/',
  plugins: [
    vue(),
    Components({
      dts: false,
      resolvers: [ElementPlusResolver()],
    }),
    developmentManifestPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@cli': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: path.join(galleryRoot, 'index.html'),
        stackblitz: path.join(galleryRoot, 'stackblitz.html'),
      },
    },
  },
})

function developmentManifestPlugin(): Plugin {
  return {
    name: 'vite-cli-gallery-development-manifest',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestPath = new URL(request.url || '/', 'http://localhost').pathname
        if (requestPath.endsWith('/manifest.json')) {
          sendJson(response, createDevelopmentManifest())
          return
        }

        const stackblitzMatch = requestPath.match(/\/stackblitz\/([a-z0-9-]+)\.json$/)
        if (!stackblitzMatch) {
          next()
          return
        }

        const slug = stackblitzMatch[1] || ''
        const entry = matrixEntriesBySlug.get(slug)
        if (!entry) {
          response.statusCode = 404
          sendJson(response, { error: `未知模板组合: ${slug}` })
          return
        }

        try {
          sendJson(response, await getDevelopmentStackBlitzProject(slug, entry))
        }
        catch (error) {
          developmentStackBlitzCache.delete(slug)
          response.statusCode = 500
          sendJson(response, {
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })
    },
  }
}

function createDevelopmentManifest() {
  const entries = configMatrix.map((entry) => {
    const slug = createConfigMatrixSlug(entry.config)
    const { targetDir, ...config } = entry.config
    void targetDir
    return {
      schemaVersion: TEMPLATE_GALLERY_SCHEMA_VERSION,
      slug,
      name: entry.name,
      config,
      urls: createTemplateArtifactUrls(slug),
      sizes: { demo: 0, sourceZip: 0, stackblitz: 0, total: 0 },
      commit: 'development',
    }
  })

  return {
    schemaVersion: TEMPLATE_GALLERY_SCHEMA_VERSION,
    commit: 'development',
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  }
}

function getDevelopmentStackBlitzProject(
  slug: string,
  entry: ConfigMatrixEntry,
): Promise<StackBlitzProjectPayload> {
  const cached = developmentStackBlitzCache.get(slug)
  if (cached) {
    return cached
  }

  const project = createDevelopmentStackBlitzProject(entry)
  developmentStackBlitzCache.set(slug, project)
  return project
}

async function createDevelopmentStackBlitzProject(
  entry: ConfigMatrixEntry,
): Promise<StackBlitzProjectPayload> {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), 'vite-cli-gallery-dev-'))
  try {
    const config = { ...entry.config, targetDir }
    await generateProject(config)
    return await createStackBlitzProject(targetDir, config)
  }
  finally {
    await rm(targetDir, { force: true, recursive: true })
  }
}

function sendJson(response: import('node:http').ServerResponse, value: unknown): void {
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(value))
}
