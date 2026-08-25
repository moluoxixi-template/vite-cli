import type { TemplateGalleryManifest } from '@cli/core/templateGallery'

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('template gallery app', () => {
  it('加载 manifest 并显示三个直接操作', async () => {
    const manifest = createManifest()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => manifest,
    }))

    const wrapper = mount(App)
    await flushPromises()
    const firstEntry = manifest.entries[0]
    if (!firstEntry) {
      throw new Error('测试 manifest 缺少条目')
    }

    expect(wrapper.text()).toContain('1 个已验证组合')
    expect(wrapper.text()).toContain('Vue 3 · Element Plus')
    expect(wrapper.text()).not.toContain(firstEntry.slug)
    expect(wrapper.find('[aria-label="打开在线 Demo"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="下载源码 ZIP"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="在 StackBlitz 中打开"]').exists()).toBe(true)
  })
})

function createManifest(): TemplateGalleryManifest {
  const slug = 'v1-vue-element-plus-standard-pages-pnpm-i0-s0-e0-h0'
  return {
    schemaVersion: 1,
    commit: 'abcdef123456',
    generatedAt: '2026-08-24T00:00:00.000Z',
    count: 1,
    entries: [{
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
      sizes: { demo: 1, sourceZip: 1, stackblitz: 1, total: 3 },
      commit: 'abcdef123456',
    }],
  }
}
