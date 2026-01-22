/**
 * Vitest 配置文件
 * 用于 CLI 工具的单元测试、集成测试和 E2E 测试
 */

import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // 第一个测试失败后立即停止（确保模板完整性检查失败时，不执行后续测试）
    bail: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['../src/**/*.ts'],
      exclude: [
        '../src/index.ts', // 排除入口文件
        '../src/**/*.d.ts', // 排除类型声明文件
        '../src/types/**', // 排除类型定义目录
        '../src/constants/**', // 排除常量目录
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    include: ['**/*.spec.ts'],
    testTimeout: 0, // 无限制
    hookTimeout: 0, // 无限制
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@test': path.resolve(__dirname, './helpers'),
    },
  },
})
