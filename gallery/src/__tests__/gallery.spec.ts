import type { TemplateGalleryEntry } from '@cli/core/templateGallery'

import { describe, expect, it } from 'vitest'

import { DEFAULT_FILTERS } from '@/composables/useGalleryQuery'
import {
  createGalleryFilterOptions,
  createStackBlitzLaunchUrl,
  filterGalleryEntries,
} from '@/lib/gallery'

const vueEntry = createEntry('vue', false)
const reactEntry = createEntry('react', true)

describe('gallery filtering', () => {
  it('按框架与功能开关筛选矩阵条目', () => {
    const result = filterGalleryEntries([vueEntry, reactEntry], {
      ...DEFAULT_FILTERS,
      framework: 'react',
      sentry: 'on',
    })

    expect(result.map(entry => entry.slug)).toEqual([reactEntry.slug])
  })

  it('从 manifest 派生筛选选项', () => {
    const options = createGalleryFilterOptions([vueEntry, reactEntry])

    expect(options.frameworks).toEqual(['react', 'vue'])
    expect(options.runtimes).toEqual(['qiankun', 'standard'])
    expect(options.packageManagers).toEqual(['pnpm'])
  })

  it('生成同站新标签页 StackBlitz 启动地址', () => {
    const url = new URL(createStackBlitzLaunchUrl(vueEntry, 'https://example.test/vite-cli/'))

    expect(url.pathname).toBe('/vite-cli/stackblitz.html')
    expect(url.searchParams.get('project')).toBe(vueEntry.urls.stackblitz)
    expect(url.searchParams.get('openFile')).toBe('src/App.vue')
  })
})

function createEntry(framework: 'vue' | 'react', microFrontend: boolean): TemplateGalleryEntry {
  const slug = `v1-${framework}-fixture`
  return {
    schemaVersion: 1,
    slug,
    name: slug,
    config: {
      projectName: slug,
      description: 'fixture',
      author: 'test',
      framework,
      uiLibrary: framework === 'vue' ? 'element-plus' : 'ant-design',
      routeMode: 'pageRoutes',
      i18n: false,
      sentry: microFrontend,
      eslint: false,
      husky: false,
      microFrontend,
      microFrontendEngine: microFrontend ? 'qiankun' : undefined,
      packageManager: 'pnpm',
    },
    urls: {
      demo: `demos/${slug}/`,
      download: `downloads/${slug}.zip`,
      stackblitz: `stackblitz/${slug}.json`,
    },
    sizes: { demo: 1, sourceZip: 1, stackblitz: 1, total: 3 },
    commit: 'test',
  }
}
