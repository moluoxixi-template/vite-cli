/**
 * Sentry Vite 插件配置
 */

import process from 'node:process'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import type { ViteConfigType, ViteFeatureContext } from '@moluoxixi/vite-config'

/**
 * 获取 Sentry Vite 配置
 * @param ctx - feature 配置上下文
 * @param ctx.viteEnv - Vite 环境变量
 * @param ctx.mode - 构建模式
 * @returns Config 配置（与 ViteConfigType 结构一致）
 */
export default ({ viteEnv, mode }: ViteFeatureContext): Partial<ViteConfigType> => ({
  viteConfig: {
    plugins: [
      viteEnv.VITE_SENTRY && mode === 'production' && sentryVitePlugin({
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
      }),
    ].filter(Boolean),
  },
})
