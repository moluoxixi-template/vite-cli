import process from 'node:process'

import fs from 'fs-extra'
import { describe, expect, it } from 'vitest'

import { cleanupTempDir, createTempDir } from '@test/test-utils'

describe('临时目录清理边界', () => {
  it('清理 createTempDir 创建的受管目录', async () => {
    const tempDir = await createTempDir('vite-cli-cleanup-')

    expect(tempDir).toBe(await fs.realpath(tempDir))
    await cleanupTempDir(tempDir)

    expect(await fs.pathExists(tempDir)).toBe(false)
  })

  it('拒绝清理非受管目录', async () => {
    await expect(cleanupTempDir(process.cwd())).rejects.toThrow('拒绝清理非 vite-cli 临时目录')
  })
})
