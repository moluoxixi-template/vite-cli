import path from 'node:path'
import cssModuleGlobalRootPlugin from '@moluoxixi/css-module-global-root-plugin'
import { ViteConfig, wrapperEnv } from '@moluoxixi/vite-config'
import { loadEnv, mergeConfig } from 'vite'
import process from 'node:process'
import { loadFeatureConfigs } from './vite/index.ts'

const config: ReturnType<typeof ViteConfig> = ViteConfig(({ mode }) => {
  const env = loadEnv(mode!, process.cwd())
  const viteEnv = wrapperEnv(env)
  const rootPath = path.resolve()
  const appCode = viteEnv.VITE_APP_CODE
  const appTitle = viteEnv.VITE_APP_TITLE
  const port = viteEnv.VITE_APP_PORT

  // 加载所有 feature 配置
  const featureConfig = loadFeatureConfigs({ viteEnv, mode: mode!, appCode })

  return {
    rootPath,
    appTitle,
    appCode,
    port,
    vue: true,
    autoComponent: true,
    pageRoutes: true,
    viteConfig: mergeConfig(
      {
        server: {
          proxy: {
            '/api': {
              changeOrigin: true,
              target: 'http://localhost:3000',
            },
          },
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        },
        css: {
          preprocessorOptions: {
            scss: {
              silenceDeprecations: ['legacy-js-api'],
              api: 'modern-compiler',
            },
            postcss: {
              plugins: [
                cssModuleGlobalRootPlugin() as any,
              ],
            },
          },
        },
      },
      featureConfig,
    ),
  }
})

export default config
