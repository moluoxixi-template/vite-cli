import path from 'node:path'
import cssModuleGlobalRootPlugin from '@moluoxixi/css-module-global-root-plugin'
import { ViteConfig, wrapperEnv } from '@moluoxixi/vite-config'
import { loadEnv, mergeConfig } from 'vite'
import process from 'node:process'
import { loadFeatureConfigs } from './vite/index.ts'

const config = ViteConfig(async (env) => {
  const { mode } = env
  const envConfig = loadEnv(mode, process.cwd())
  const viteEnv = wrapperEnv(envConfig)
  const rootPath = path.resolve()
  const appCode = viteEnv.VITE_APP_CODE
  const appTitle = viteEnv.VITE_APP_TITLE
  const port = viteEnv.VITE_APP_PORT

  // 加载所有 feature 配置（与 ViteConfigType 结构一致）
  const featureConfig = await loadFeatureConfigs({ ...env, viteEnv, mode, appCode })

  return {
    rootPath,
    appTitle,
    appCode,
    port,
    autoComponent: true,
    ...featureConfig,
    viteConfig: mergeConfig(
      {
        build: {
          outDir: 'dist',
        },
        server: {
          proxy: {
            '/api': {
              changeOrigin: true,
              target: 'http://localhost:3000',
            },
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
      featureConfig.viteConfig ?? {},
    ),
  }
})

export default config
