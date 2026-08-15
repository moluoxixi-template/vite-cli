/**
 * install.ts 单元测试
 * 测试依赖安装工具函数
 * 注意：实际安装测试在 E2E 中进行，这里主要测试参数验证和错误处理
 */

import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'fs-extra'
import { PACKAGE_MANAGERS } from '@/constants'
import type { PackageManagerType } from '@/types'

// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => ({
    on: vi.fn((event, callback) => {
      if (event === 'close') {
        // 模拟成功退出
        setTimeout(callback, 10, 0)
      }
    }),
  })),
  exec: vi.fn((cmd, options, callback) => {
    if (callback) {
      callback(null, '', '')
    }
    return { on: vi.fn() }
  }),
}))

// 动态导入被测模块（在 mock 之后）
const { installDependencies, initGit } = await import('@/utils/install')

// 测试用临时目录
let tempDir: string

beforeEach(async () => {
  tempDir = path.join(process.cwd(), '__test__', 'temp-install-test', `test-${Date.now()}`)
  await fs.ensureDir(tempDir)
  vi.clearAllMocks()
})

afterEach(async () => {
  if (await fs.pathExists(tempDir)) {
    await fs.remove(tempDir)
  }
})

describe('installDependencies', () => {
  describe('参数验证', () => {
    it('应该接受有效的包管理器类型', async () => {
      for (const pm of PACKAGE_MANAGERS) {
        // 由于 mock 了 spawn，这里只验证不会因参数验证而抛出错误
        await expect(installDependencies(pm, tempDir)).resolves.not.toThrow()
      }
    })

    it('应该拒绝不支持的包管理器类型', async () => {
      const invalidPm = 'invalid-pm' as PackageManagerType
      await expect(installDependencies(invalidPm, tempDir))
        .rejects
        .toThrow('不支持的包管理器')
    })

    it('应该拒绝包含路径遍历的工作目录', async () => {
      const maliciousCwd = '../../../etc'
      await expect(installDependencies('pnpm', maliciousCwd))
        .rejects
        .toThrow('不安全的路径')
    })

    it('应该拒绝包含 ~/ 的工作目录（home 目录）', async () => {
      const maliciousCwd = '~/secret'
      await expect(installDependencies('pnpm', maliciousCwd))
        .rejects
        .toThrow('不安全的路径')
    })
  })

  describe('重试机制', () => {
    it('应该支持 retries 参数', async () => {
      // 默认 retries = 0，不重试
      await expect(installDependencies('pnpm', tempDir, 0)).resolves.not.toThrow()
    })

    it('应该支持多次重试', async () => {
      // 设置 retries = 2，允许重试 2 次
      await expect(installDependencies('pnpm', tempDir, 2)).resolves.not.toThrow()
    })
  })

  describe('包管理器命令', () => {
    it('应该为 pnpm 使用正确的安装命令', async () => {
      const { spawn } = await import('node:child_process')
      await installDependencies('pnpm', tempDir)

      expect(spawn).toHaveBeenCalledWith(
        'pnpm',
        ['install'],
        expect.objectContaining({ cwd: tempDir }),
      )
    })

    it('应该为 npm 使用正确的安装命令', async () => {
      const { spawn } = await import('node:child_process')
      await installDependencies('npm', tempDir)

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['install'],
        expect.objectContaining({ cwd: tempDir }),
      )
    })

    it('应该为 yarn 使用正确的安装命令', async () => {
      const { spawn } = await import('node:child_process')
      await installDependencies('yarn', tempDir)

      expect(spawn).toHaveBeenCalledWith(
        'yarn',
        ['install'],
        expect.objectContaining({ cwd: tempDir }),
      )
    })
  })
})

describe('initGit', () => {
  describe('正常流程', () => {
    it('应该不抛出错误（静默失败）', async () => {
      // initGit 设计为静默失败，不影响项目创建
      await expect(initGit(tempDir, 'test-project')).resolves.not.toThrow()
    })
  })

  describe('参数验证', () => {
    it('应该接受有效的项目名称', async () => {
      await expect(initGit(tempDir, 'my-awesome-project')).resolves.not.toThrow()
    })

    it('应该处理包含特殊字符的项目名称', async () => {
      // Git commit message 会包含项目名称，但函数应该处理这种情况
      await expect(initGit(tempDir, 'project-with-dash')).resolves.not.toThrow()
    })
  })

  describe('安全性', () => {
    it('应该验证路径安全性', async () => {
      // initGit 内部调用 validatePath，但由于是静默失败，不会抛出
      // 这里验证函数不会崩溃
      await expect(initGit(tempDir, 'test')).resolves.not.toThrow()
    })
  })
})
