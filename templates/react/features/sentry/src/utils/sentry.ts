import * as Sentry from '@sentry/react'

interface SentryConfig {
  dsn: string
  environment?: string
  release?: string
}

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

