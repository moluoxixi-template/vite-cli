import { effectScope, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'

import { readGalleryPageSize, useGalleryQuery } from '@/composables/useGalleryQuery'

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('gallery query state', () => {
  it('只接受界面支持的分页大小', () => {
    expect(readGalleryPageSize('10')).toBe(10)
    expect(readGalleryPageSize('50')).toBe(50)
    expect(readGalleryPageSize('25')).toBe(10)
    expect(readGalleryPageSize('9999')).toBe(10)
  })

  it('切换分页大小时返回第一页并同步 URL', async () => {
    window.history.replaceState(null, '', '/?page=10&size=10')
    const scope = effectScope()
    const query = scope.run(() => useGalleryQuery())
    if (!query) {
      throw new Error('查询状态初始化失败')
    }

    query.pageSize.value = 50
    await nextTick()

    expect(query.page.value).toBe(1)
    expect(window.location.search).toBe('?size=50')
    scope.stop()
  })
})
