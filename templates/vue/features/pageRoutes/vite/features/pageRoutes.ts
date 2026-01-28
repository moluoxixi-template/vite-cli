/**
 * PageRoutes Vite 配置
 * 启用文件系统路由 (vite-plugin-pages)
 */

import type { ViteConfigType, ViteFeatureContext } from '@moluoxixi/vite-config'

/**
 * 获取 PageRoutes 配置
 * @param _ctx - feature 配置上下文（未使用）
 * @returns Config 配置（与 ViteConfigType 结构一致）
 */
export default (_ctx: ViteFeatureContext): Partial<ViteConfigType> => ({
  pageRoutes: true,
})
