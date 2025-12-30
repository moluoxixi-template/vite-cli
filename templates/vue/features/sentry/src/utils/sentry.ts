import type { App } from 'vue'
import type { Router } from 'vue-router'
import * as Sentry from '@sentry/vue'

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
 * @param app Vue 应用实例
 * @param router Vue Router 实例
 * @param config Sentry 配置
 */
export function initSentry(app: App, router: Router, config: SentryConfig): void {
  const { dsn, environment = 'production', release } = config

  if (!dsn) {
    console.warn('[Sentry] DSN is not configured, skipping initialization')
    return
  }

  Sentry.init({
    app,
    dsn,
    environment,
    release,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}
