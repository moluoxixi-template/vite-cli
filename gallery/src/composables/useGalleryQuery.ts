import type { GalleryFilters, ToggleFilter } from '@/types'

import { reactive, ref, watch } from 'vue'

const TOGGLE_VALUES = new Set<ToggleFilter>(['all', 'on', 'off'])
export const GALLERY_PAGE_SIZES = [24, 48, 96] as const

export const DEFAULT_FILTERS: GalleryFilters = {
  search: '',
  framework: '',
  uiLibrary: '',
  runtime: '',
  routeMode: '',
  packageManager: '',
  i18n: 'all',
  sentry: 'all',
  eslint: 'all',
  husky: 'all',
}

export function useGalleryQuery() {
  const params = new URLSearchParams(window.location.search)
  const filters = reactive<GalleryFilters>({
    search: params.get('q') || '',
    framework: params.get('framework') || '',
    uiLibrary: params.get('ui') || '',
    runtime: params.get('runtime') || '',
    routeMode: params.get('route') || '',
    packageManager: params.get('pm') || '',
    i18n: readToggle(params, 'i18n'),
    sentry: readToggle(params, 'sentry'),
    eslint: readToggle(params, 'eslint'),
    husky: readToggle(params, 'husky'),
  })
  const page = ref(readPositiveInteger(params.get('page'), 1))
  const pageSize = ref(readGalleryPageSize(params.get('size')))

  watch(filters, () => {
    page.value = 1
    syncQuery(filters, page.value, pageSize.value)
  }, { deep: true })
  watch(pageSize, () => {
    page.value = 1
  })
  watch([page, pageSize], () => syncQuery(filters, page.value, pageSize.value))

  function resetFilters(): void {
    Object.assign(filters, DEFAULT_FILTERS)
  }

  return { filters, page, pageSize, resetFilters }
}

export function readGalleryPageSize(value: string | null): number {
  const parsed = Number(value)
  return GALLERY_PAGE_SIZES.includes(parsed as typeof GALLERY_PAGE_SIZES[number]) ? parsed : 24
}

function readToggle(params: URLSearchParams, key: string): ToggleFilter {
  const value = params.get(key) as ToggleFilter | null
  return value && TOGGLE_VALUES.has(value) ? value : 'all'
}

function readPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function syncQuery(filters: GalleryFilters, page: number, pageSize: number): void {
  const params = new URLSearchParams()
  setWhen(params, 'q', filters.search)
  setWhen(params, 'framework', filters.framework)
  setWhen(params, 'ui', filters.uiLibrary)
  setWhen(params, 'runtime', filters.runtime)
  setWhen(params, 'route', filters.routeMode)
  setWhen(params, 'pm', filters.packageManager)
  setWhen(params, 'i18n', filters.i18n === 'all' ? '' : filters.i18n)
  setWhen(params, 'sentry', filters.sentry === 'all' ? '' : filters.sentry)
  setWhen(params, 'eslint', filters.eslint === 'all' ? '' : filters.eslint)
  setWhen(params, 'husky', filters.husky === 'all' ? '' : filters.husky)
  setWhen(params, 'page', page === 1 ? '' : String(page))
  setWhen(params, 'size', pageSize === 24 ? '' : String(pageSize))
  const query = params.toString()
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
}

function setWhen(params: URLSearchParams, key: string, value: string): void {
  if (value) {
    params.set(key, value)
  }
}
