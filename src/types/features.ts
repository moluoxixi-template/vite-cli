/**
 * 特性配置定义
 * 核心依赖和微前端引擎类型定义
 *
 * 注意：Features 现在通过文件系统扫描自动发现，无需在此维护常量列表
 * 参考：src/utils/renderFeatures.ts
 */

/**
 * 生成项目可使用的 @moluoxixi 外部依赖版本。
 * 请求能力以源码形式内置，不在这里声明黑盒依赖。
 */
export const MOLUOXIXI_DEPS = {
  '@moluoxixi/eslint-config': '0.0.16',
} as const

/**
 * 微前端引擎类型定义
 * 注意：这里只保留历史能力的类型集合，运行时支持状态由
 * src/core/capabilities.ts 中的 MICRO_FRONTEND_ENGINE_CAPABILITIES 决定。
 */
export type MicroFrontendEngine = 'qiankun' | 'micro-app'
