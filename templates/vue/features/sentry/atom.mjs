export default {
  id: 'vue:sentry',
  main: {
    imports: [
      'import { initSentry } from \'@/utils/sentry\'',
    ],
    afterAppUses: [
      `initSentry(app, router, {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
})`,
    ],
  },
  vite: {
    imports: [
      'import { sentryVitePlugin } from \'@sentry/vite-plugin\'',
    ],
    plugins: [
      `if (env.VITE_SENTRY === 'true' && mode === 'production') {
  plugins.push(sentryVitePlugin({
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: 'f1f562b9b82f',
    project: 'javascript-vue',
    sourcemaps: {
      assets: './dist/**',
      ignore: ['node_modules'],
    },
    release: {
      name: env.VITE_APP_VERSION || 'unknown',
    },
  }))
}`,
    ],
  },
}
