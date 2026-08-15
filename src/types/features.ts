/**
 * 特性配置定义
 * 核心依赖和微前端引擎类型定义
 *
 * 注意：Features 现在通过文件系统扫描自动发现，无需在此维护常量列表
 * 参考：src/utils/renderFeatures.ts
 */

/**
 * @moluoxixi 核心依赖配置
 * 这些依赖必须在所有项目中存在
 */
export const MOLUOXIXI_DEPS = {
  '@moluoxixi/eslint-config': '0.0.16',
  '@moluoxixi/ajax-package': '0.0.60',
} as const

/**
 * 微前端引擎类型定义
 * 注意：这里只保留历史能力的类型集合，运行时支持状态由
 * src/core/capabilities.ts 中的 MICRO_FRONTEND_ENGINE_CAPABILITIES 决定。
 */
export type MicroFrontendEngine = 'qiankun' | 'micro-app'
