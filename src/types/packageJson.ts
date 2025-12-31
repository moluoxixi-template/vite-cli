/**
 * package.json 类型定义
 */

/**
 * package.json 文件结构接口
 */
export interface PackageJson {
  /** 包名称 */
  name?: string
  /** 版本号 */
  version?: string
  /** 描述 */
  description?: string
  /** 作者 */
  author?: string
  /** 包管理器及版本 */
  packageManager?: string
  /** 生产依赖 */
  dependencies?: Record<string, string>
  /** 开发依赖 */
  devDependencies?: Record<string, string>
  /** 其他字段 */
  [key: string]: unknown
}

