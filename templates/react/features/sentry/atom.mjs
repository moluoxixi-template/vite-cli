export default {
  id: 'react:sentry',
  main: {
    imports: [
      'import { initSentry } from \'@/utils/sentry\'',
    ],
    setup: [
      `initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,
})`,
    ],
  },
  vite: {
    imports: [
      'import { sentryVitePlugin } from \'@sentry/vite-plugin\'',
    ],
    plugins: [
      `if (env.VITE_SENTRY === 'true' && mode === 'production' && env.SENTRY_AUTH_TOKEN) {
  plugins.push(sentryVitePlugin({
    authToken: env.SENTRY_AUTH_TOKEN,
    org: env.VITE_SENTRY_ORG,
    project: env.VITE_SENTRY_PROJECT,
    sourcemaps: {
      assets: './dist/**',
      ignore: ['node_modules'],
    },
    release: {
      name: env.VITE_APP_VERSION || 'unknown',
    },
    telemetry: false,
  }))
}`,
    ],
  },
}
