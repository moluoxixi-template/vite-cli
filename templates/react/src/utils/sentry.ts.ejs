/**
 * Sentry 错误监控配置
 * 仅在生产环境且配置了 VITE_SENTRY 时启用
 */

import * as Sentry from '@sentry/react'

/**
 * 初始化 Sentry
 */
export function initSentry(): void {
  // 仅在配置了 VITE_SENTRY 时初始化
  if (!import.meta.env.VITE_SENTRY) {
    return
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // 性能监控
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // 环境
    environment: import.meta.env.MODE,
    // 发布版本
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
  })
}
