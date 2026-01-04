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
  '@moluoxixi/eslint-config': 'latest',
  '@moluoxixi/vite-config': 'latest',
  '@moluoxixi/ajax-package': 'latest',
  '@moluoxixi/class-names': 'latest',
  '@moluoxixi/css-module-global-root-plugin': 'latest',
} as const

/**
 * 微前端引擎类型
 */
export const MICRO_FRONTEND_ENGINES = ['qiankun', 'micro-app'] as const

export type MicroFrontendEngine = typeof MICRO_FRONTEND_ENGINES[number]
