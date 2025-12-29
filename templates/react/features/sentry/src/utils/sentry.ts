import * as Sentry from '@sentry/react'

/**
 * Sentry 配置接口
 */
interface SentryConfig {
  /** Sentry DSN（数据源名称） */
  dsn: string
  /** 环境名称（可选，默认为 'production'） */
  environment?: string
  /** 发布版本（可选） */
  release?: string
}

/**
 * 初始化 Sentry 错误监控
 * @param config Sentry 配置
 */
export function initSentry(config: SentryConfig): void {
  const { dsn, environment = 'production', release } = config

  if (!dsn) {
    console.warn('[Sentry] DSN is not configured, skipping initialization')
    return
  }

  Sentry.init({
    dsn,
    environment,
    release,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

