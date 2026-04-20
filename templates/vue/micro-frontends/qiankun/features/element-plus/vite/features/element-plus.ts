/**
 * Element Plus Vite 配置 - Qiankun 模式
 * 为 Element Plus 添加 SCSS 命名空间配置
 */

import type { ViteConfigType, ViteFeatureContext } from '@moluoxixi/vite-config'
import { defineConfig } from 'vite'

/**
 * 获取 Element Plus Vite 配置
 * @param ctx - feature 配置上下文
 * @param ctx.appCode - 应用代码，用于 SCSS 命名空间
 * @returns Config 配置（与 ViteConfigType 结构一致）
 */
export default ({ appCode }: ViteFeatureContext): Partial<ViteConfigType> => ({
  viteConfig: defineConfig((_env) => ({
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
  })),
})
