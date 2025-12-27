/**
 * 特性配置定义
 * 定义所有可用特性的 ID
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
 * Vue 特性 ID
 */
export const VUE_FEATURES = [
  'router',
  'pinia',
  'eslint',
  'i18n',
  'sentry',
  'qiankun',
  'pageRoutes',
  'element-plus',
  'ant-design-vue',
] as const

/**
 * React 特性 ID
 */
export const REACT_FEATURES = [
  'router',
  'zustand',
  'eslint',
  'i18n',
  'sentry',
  'ant-design',
] as const

export type VueFeatureId = typeof VUE_FEATURES[number]
export type ReactFeatureId = typeof REACT_FEATURES[number]
