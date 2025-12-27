/**
 * Vite 配置文件
 * 基于 @moluoxixi/vite-config 的配置
 */

import path from 'node:path'
import process from 'node:process'
import cssModuleGlobalRootPlugin from '@moluoxixi/css-module-global-root-plugin'
import { ViteConfig, wrapperEnv } from '@moluoxixi/vite-config'
import { loadEnv } from 'vite'

export default ViteConfig(
  ({ mode }) => {
    const env = loadEnv(mode!, process.cwd())
    const viteEnv = wrapperEnv(env)
    const rootPath = path.resolve()
    const appCode = viteEnv.VITE_APP_CODE
    const appTitle = viteEnv.VITE_APP_TITLE
    const port = viteEnv.VITE_APP_PORT
    return {
      rootPath,
      appTitle,
      appCode,
      port,
      vue: true,
      autoComponent: true,
      viteConfig: {
        plugins: [],
        server: {
          proxy: {
            '/api': {
              changeOrigin: true,
              target: 'http://localhost:3000',
            },
          },
        },
        css: {
          postcss: {
            plugins: [
              cssModuleGlobalRootPlugin,
            ],
          },
          preprocessorOptions: {
            scss: {
              silenceDeprecations: ['legacy-js-api'],
              api: 'modern-compiler',
            },
          },
        },
      },
    }
  },
)
