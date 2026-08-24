/**
 * 测试配置生成器兼容入口。
 * 实际矩阵由 src/core/configMatrix.ts 维护，供测试与模板展厅共享。
 */

export {
  generateConfigMatrix as generateTestConfigs,
} from '@/core/configMatrix'
export type {
  ConfigMatrixEntry as TestConfig,
  ConfigMatrixOptions as TestConfigOptions,
} from '@/core/configMatrix'
