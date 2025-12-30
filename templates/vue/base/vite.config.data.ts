import type { ViteConfigData } from '../../../../src/types/viteConfig'

const data: ViteConfigData = {
  options: {
    vue: true,
    autoComponent: true,
  },
  config: {
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
        plugins: ["cssModuleGlobalRootPlugin() as any"],
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

export default data

