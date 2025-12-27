/**
 * 环境变量类型声明
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_CODE: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_PORT: number
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_SENTRY: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
