import type { TemplateGalleryEntry } from '@cli/core/templateGallery'
import type { GalleryFilterOptions, GalleryFilters, ToggleFilter } from '@/types'

export function getEntryRuntime(entry: TemplateGalleryEntry): string {
  return entry.config.microFrontend
    ? entry.config.microFrontendEngine || 'micro-frontend'
    : 'standard'
}

export function filterGalleryEntries(
  entries: TemplateGalleryEntry[],
  filters: GalleryFilters,
): TemplateGalleryEntry[] {
  const search = filters.search.trim().toLowerCase()
  return entries.filter((entry) => {
    const searchable = `${entry.name} ${entry.slug} ${entry.config.framework} ${entry.config.uiLibrary}`.toLowerCase()
    return (!search || searchable.includes(search))
      && (!filters.framework || entry.config.framework === filters.framework)
      && (!filters.uiLibrary || entry.config.uiLibrary === filters.uiLibrary)
      && (!filters.runtime || getEntryRuntime(entry) === filters.runtime)
      && (!filters.routeMode || entry.config.routeMode === filters.routeMode)
      && (!filters.packageManager || entry.config.packageManager === filters.packageManager)
      && matchesToggle(entry.config.i18n, filters.i18n)
      && matchesToggle(entry.config.sentry, filters.sentry)
      && matchesToggle(entry.config.eslint, filters.eslint)
      && matchesToggle(entry.config.husky, filters.husky)
  })
}

export function createGalleryFilterOptions(entries: TemplateGalleryEntry[]): GalleryFilterOptions {
  return {
    frameworks: unique(entries.map(entry => entry.config.framework)),
    uiLibraries: unique(entries.map(entry => entry.config.uiLibrary)),
    runtimes: unique(entries.map(getEntryRuntime)),
    routeModes: unique(entries.map(entry => entry.config.routeMode)),
    packageManagers: unique(entries.map(entry => entry.config.packageManager)),
  }
}

export function createArtifactUrl(relativePath: string, baseUrl: string): string {
  return new URL(relativePath, baseUrl).href
}

export function createStackBlitzLaunchUrl(entry: TemplateGalleryEntry, baseUrl: string): string {
  const launchUrl = new URL('stackblitz.html', baseUrl)
  launchUrl.searchParams.set('project', entry.urls.stackblitz)
  launchUrl.searchParams.set('openFile', entry.config.framework === 'vue' ? 'src/App.vue' : 'src/App.tsx')
  return launchUrl.href
}

export function formatBytes(value: number): string {
  if (value === 0) {
    return '待构建'
  }
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function matchesToggle(value: boolean, filter: ToggleFilter): boolean {
  return filter === 'all' || value === (filter === 'on')
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right))
}
