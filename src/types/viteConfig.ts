/**
 * Vite 配置数据类型定义
 * 用于 features 中的 vite.config.data.ts
 */

/**
 * Vite 配置数据接口
 */
export interface ViteConfigData {
  /** 导入语句字符串数组（完整的 import 语句） */
  imports?: string[]
  /** 插件初始化字符串数组 */
  plugins?: string[]
  /** 纯 JSON 数据配置（包含 server, build, resolve 等静态配置） */
  config?: Record<string, unknown>
  /** ViteConfig 顶层选项（如 pageRoutes） */
  options?: Record<string, unknown>
  /** 函数逻辑分片映射，Key 为配置项的深度访问路径（如 'css.preprocessorOptions.scss.additionalData'） */
  hooks?: Record<string, string>
}
