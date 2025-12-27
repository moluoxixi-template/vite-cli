/**
 * Vite 配置数据类型定义
 * 用于 features 中的 vite.config.data.ts
 */

export interface ViteConfigData {
  /** 导入语句 */
  imports?: string[]
  /** ViteConfig 选项 */
  options?: Record<string, unknown>
  /** 插件配置 */
  plugins?: string[]
  /** CSS 配置 */
  css?: {
    additionalData?: string
  }
}
