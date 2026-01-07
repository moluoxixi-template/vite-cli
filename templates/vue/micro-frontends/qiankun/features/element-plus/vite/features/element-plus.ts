/**
 * Element Plus Vite 配置 - Qiankun 模式
 * 为 Element Plus 添加 SCSS 命名空间配置
 */

/**
 * Vite feature 配置上下文
 */
interface ViteFeatureContext {
  viteEnv: Record<string, any>
  mode: string
  appCode: string
}

/**
 * 获取 Element Plus Vite 配置
 * @param ctx - feature 配置上下文
 * @param ctx.appCode - 应用代码，用于 SCSS 命名空间
 * @returns Vite UserConfig
 */
export default ({ appCode }: ViteFeatureContext) => ({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: (source: string, filename: string) => {
          if (filename.includes('assets/styles/element/index.scss')) {
            return `$namespace: ${appCode || 'el'};
            ${source}`
          }
          return source
        },
      },
    },
  },
})
