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
        '../src/test.ts', // 排除现有的测试脚本
        '../src/index.ts', // 排除入口文件
        '**/*.d.ts',
        '**/types/**',
        '**/constants/**',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    include: ['**/*.spec.ts'],
    testTimeout: 60000, // 60s for integration tests
    hookTimeout: 60000, // 60s for beforeAll/afterAll
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@test': path.resolve(__dirname, './helpers'),
    },
  },
})
