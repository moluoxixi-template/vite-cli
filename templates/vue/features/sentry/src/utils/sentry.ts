import type { App } from 'vue'
import type { Router } from 'vue-router'
import * as Sentry from '@sentry/vue'

interface SentryConfig {
  dsn: string
  environment?: string
  release?: string
}

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

