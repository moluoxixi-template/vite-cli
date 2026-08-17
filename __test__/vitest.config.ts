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

    // ========== 测试执行策略 ==========
    // 不使用 bail，运行所有测试以显示所有错误
    // bail: 1,

    // 并行执行配置
    pool: process.platform === 'win32' ? 'forks' : 'threads',
    // E2E 测试文件内的测试并发执行
    fileParallelism: true,
    maxWorkers: 2,
    maxConcurrency: 2,

    // ========== 超时配置 ==========
    // 测试超时：10 分钟（E2E 测试需要安装依赖和类型检查，可能需要较长时间）
    testTimeout: 10 * 60 * 1000,
    // Hook（beforeAll/afterAll）超时：3 分钟（E2E 测试的 beforeAll 需要生成项目）
    hookTimeout: 3 * 60 * 1000,

    // ========== 重试机制 ==========
    // E2E 测试可能因网络波动失败，允许重试 1 次
    retry: 1,

    // ========== 覆盖率配置 ==========
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

    // ========== 测试报告 ==========
    reporters: [
      'default',
      // JUnit 报告格式，用于 CI 集成（Jenkins、GitLab CI 等）
      ['junit', { outputFile: './test-results/junit.xml' }],
    ],

    include: ['**/*.spec.ts'],

    // ========== 输出配置 ==========
    // 显示慢测试（超过 1 秒）
    slowTestThreshold: 1000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@test': path.resolve(__dirname, './helpers'),
    },
  },
})
