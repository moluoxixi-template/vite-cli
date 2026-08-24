export type ToggleFilter = 'all' | 'on' | 'off'

export interface GalleryFilters {
  search: string
  framework: string
  uiLibrary: string
  runtime: string
  routeMode: string
  packageManager: string
  i18n: ToggleFilter
  sentry: ToggleFilter
  eslint: ToggleFilter
  husky: ToggleFilter
}

export interface GalleryFilterOptions {
  frameworks: string[]
  uiLibraries: string[]
  runtimes: string[]
  routeModes: string[]
  packageManagers: string[]
}
