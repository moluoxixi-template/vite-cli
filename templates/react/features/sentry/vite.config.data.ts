import type { ViteConfigData } from '../../../../src/types/viteConfig'

const data: ViteConfigData = {
  imports: [
    'import { sentryVitePlugin } from \'@sentry/vite-plugin\'',
  ],
  plugins: [
    `viteEnv.VITE_SENTRY && mode === 'production' && sentryVitePlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: 'f1f562b9b82f',
            project: 'javascript-react',
            sourcemaps: {
              assets: './dist/**',
              ignore: ['node_modules'],
            },
            release: {
              name: viteEnv.VITE_APP_VERSION || 'unknown',
            },
          })`,
  ],
}

export default data
