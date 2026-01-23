/**
 * file.ts 单元测试
 * 测试文件操作工具函数
 */

import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'fs-extra'
import {
  copyDir,
  copyFile,
  createDir,
  emptyDir,
  getFiles,
  getRelativePath,
  getTemplatesDir,
  pathExists,
  readFile,
  readJsonFile,
  validatePath,
  writeFile,
  writeJsonFile,
} from '@/utils/file'

// 测试用临时目录
let tempDir: string

beforeEach(async () => {
  tempDir = path.join(process.cwd(), '__test__', 'temp-file-test', `test-${Date.now()}`)
  await fs.ensureDir(tempDir)
})

afterEach(async () => {
  if (await fs.pathExists(tempDir)) {
    await fs.remove(tempDir)
  }
})

describe('validatePath', () => {
  describe('正常流程', () => {
    it('应该接受有效的绝对路径', () => {
      expect(() => validatePath('/home/user/project')).not.toThrow()
    })

    it('应该接受有效的相对路径', () => {
      expect(() => validatePath('src/utils/file.ts')).not.toThrow()
    })

    it('应该接受带有 baseDir 的有效路径', () => {
      const baseDir = '/home/user/project'
      const filePath = '/home/user/project/src/index.ts'
      expect(() => validatePath(filePath, baseDir)).not.toThrow()
    })
  })

  describe('错误处理', () => {
    it('应该拒绝包含 .. 的路径（路径遍历攻击）', () => {
      expect(() => validatePath('../../../etc/passwd')).toThrow('不安全的路径')
    })

    it('应该拒绝包含 ~/ 的路径（home 目录）', () => {
      expect(() => validatePath('~/secret/file')).toThrow('不安全的路径')
    })

    it('应该允许 Vite 路径别名（如 ~pages）', () => {
      // ~pages 是 vite-plugin-pages 的路径别名，应该允许
      expect(() => validatePath('~pages/index')).not.toThrow()
      expect(() => validatePath('~page')).not.toThrow()
    })

    it('应该拒绝超出 baseDir 范围的路径', () => {
      const baseDir = '/home/user/project'
      const filePath = '/home/user/other/file.ts'
      expect(() => validatePath(filePath, baseDir)).toThrow('路径超出允许范围')
    })
  })

  describe('边界条件', () => {
    it('应该处理空字符串路径', () => {
      expect(() => validatePath('')).not.toThrow()
    })

    it('应该处理只有文件名的路径', () => {
      expect(() => validatePath('file.txt')).not.toThrow()
    })
  })
})

describe('createDir', () => {
  it('应该创建目录', () => {
    const dirPath = path.join(tempDir, 'new-dir')
    createDir(dirPath)
    expect(fs.existsSync(dirPath)).toBe(true)
  })

  it('应该创建嵌套目录', () => {
    const dirPath = path.join(tempDir, 'level1', 'level2', 'level3')
    createDir(dirPath)
    expect(fs.existsSync(dirPath)).toBe(true)
  })

  it('应该对已存在的目录不报错', () => {
    const dirPath = path.join(tempDir, 'existing-dir')
    fs.mkdirSync(dirPath)
    expect(() => createDir(dirPath)).not.toThrow()
  })
})

describe('emptyDir', () => {
  it('应该清空目录内容', () => {
    const dirPath = path.join(tempDir, 'dir-to-empty')
    fs.mkdirSync(dirPath)
    fs.writeFileSync(path.join(dirPath, 'file1.txt'), 'content1')
    fs.writeFileSync(path.join(dirPath, 'file2.txt'), 'content2')

    emptyDir(dirPath)

    expect(fs.existsSync(dirPath)).toBe(true)
    expect(fs.readdirSync(dirPath)).toHaveLength(0)
  })

  it('应该创建不存在的目录', () => {
    const dirPath = path.join(tempDir, 'non-existing-dir')
    emptyDir(dirPath)
    expect(fs.existsSync(dirPath)).toBe(true)
  })
})

describe('pathExists', () => {
  it('应该返回 true 当路径存在时', () => {
    const filePath = path.join(tempDir, 'existing-file.txt')
    fs.writeFileSync(filePath, 'content')
    expect(pathExists(filePath)).toBe(true)
  })

  it('应该返回 false 当路径不存在时', () => {
    const filePath = path.join(tempDir, 'non-existing-file.txt')
    expect(pathExists(filePath)).toBe(false)
  })

  it('应该返回 true 当目录存在时', () => {
    expect(pathExists(tempDir)).toBe(true)
  })
})

describe('copyFile', () => {
  it('应该复制文件', () => {
    const srcPath = path.join(tempDir, 'source.txt')
    const destPath = path.join(tempDir, 'dest.txt')
    fs.writeFileSync(srcPath, 'file content')

    copyFile(srcPath, destPath)

    expect(fs.existsSync(destPath)).toBe(true)
    expect(fs.readFileSync(destPath, 'utf-8')).toBe('file content')
  })

  it('应该创建目标目录（如果不存在）', () => {
    const srcPath = path.join(tempDir, 'source.txt')
    const destPath = path.join(tempDir, 'new-dir', 'dest.txt')
    fs.writeFileSync(srcPath, 'content')

    copyFile(srcPath, destPath)

    expect(fs.existsSync(destPath)).toBe(true)
  })

  it('应该在源文件不存在时抛出错误', () => {
    const srcPath = path.join(tempDir, 'non-existing.txt')
    const destPath = path.join(tempDir, 'dest.txt')

    expect(() => copyFile(srcPath, destPath)).toThrow()
  })
})

describe('copyDir', () => {
  it('应该复制整个目录', () => {
    const srcDir = path.join(tempDir, 'source-dir')
    const destDir = path.join(tempDir, 'dest-dir')

    fs.mkdirSync(srcDir)
    fs.writeFileSync(path.join(srcDir, 'file1.txt'), 'content1')
    fs.mkdirSync(path.join(srcDir, 'sub-dir'))
    fs.writeFileSync(path.join(srcDir, 'sub-dir', 'file2.txt'), 'content2')

    copyDir(srcDir, destDir)

    expect(fs.existsSync(destDir)).toBe(true)
    expect(fs.existsSync(path.join(destDir, 'file1.txt'))).toBe(true)
    expect(fs.existsSync(path.join(destDir, 'sub-dir', 'file2.txt'))).toBe(true)
  })
})

describe('writeFile', () => {
  it('应该写入文件内容', () => {
    const filePath = path.join(tempDir, 'write-test.txt')
    writeFile(filePath, 'test content')

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('test content')
  })

  it('应该创建父目录（如果不存在）', () => {
    const filePath = path.join(tempDir, 'new-parent', 'write-test.txt')
    writeFile(filePath, 'content')

    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('应该覆盖已存在的文件', () => {
    const filePath = path.join(tempDir, 'overwrite.txt')
    fs.writeFileSync(filePath, 'old content')

    writeFile(filePath, 'new content')

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('new content')
  })
})

describe('readFile', () => {
  it('应该读取文件内容', () => {
    const filePath = path.join(tempDir, 'read-test.txt')
    fs.writeFileSync(filePath, 'readable content')

    expect(readFile(filePath)).toBe('readable content')
  })

  it('应该在文件不存在时抛出错误', () => {
    const filePath = path.join(tempDir, 'non-existing.txt')
    expect(() => readFile(filePath)).toThrow()
  })
})

describe('readJsonFile', () => {
  it('应该读取并解析 JSON 文件', () => {
    const filePath = path.join(tempDir, 'test.json')
    const jsonData = { name: 'test', version: '1.0.0' }
    fs.writeFileSync(filePath, JSON.stringify(jsonData))

    const result = readJsonFile(filePath)
    expect(result).toEqual(jsonData)
  })

  it('应该在文件不存在时抛出错误', () => {
    const filePath = path.join(tempDir, 'non-existing.json')
    expect(() => readJsonFile(filePath)).toThrow()
  })

  it('应该在 JSON 格式无效时抛出错误', () => {
    const filePath = path.join(tempDir, 'invalid.json')
    fs.writeFileSync(filePath, '{ invalid json }')

    expect(() => readJsonFile(filePath)).toThrow()
  })
})

describe('writeJsonFile', () => {
  it('应该写入 JSON 文件', () => {
    const filePath = path.join(tempDir, 'output.json')
    const data = { name: 'test', version: '1.0.0' }

    writeJsonFile(filePath, data)

    const content = fs.readFileSync(filePath, 'utf-8')
    expect(JSON.parse(content)).toEqual(data)
  })

  it('应该使用 2 空格缩进', () => {
    const filePath = path.join(tempDir, 'formatted.json')
    const data = { name: 'test' }

    writeJsonFile(filePath, data)

    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('  ') // 2 空格缩进
  })

  it('应该创建父目录（如果不存在）', () => {
    const filePath = path.join(tempDir, 'new-parent', 'output.json')
    writeJsonFile(filePath, { test: true })

    expect(fs.existsSync(filePath)).toBe(true)
  })
})

describe('getFiles', () => {
  beforeEach(() => {
    // 创建测试目录结构
    const testDir = path.join(tempDir, 'files-test')
    fs.mkdirSync(testDir)
    fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content')
    fs.mkdirSync(path.join(testDir, 'sub-dir'))
    fs.writeFileSync(path.join(testDir, 'sub-dir', 'file2.txt'), 'content')
    fs.mkdirSync(path.join(testDir, 'sub-dir', 'nested'))
    fs.writeFileSync(path.join(testDir, 'sub-dir', 'nested', 'file3.txt'), 'content')
  })

  it('应该递归获取所有文件', () => {
    const testDir = path.join(tempDir, 'files-test')
    const files = getFiles(testDir)

    expect(files).toHaveLength(3)
    expect(files.some(f => f.endsWith('file1.txt'))).toBe(true)
    expect(files.some(f => f.endsWith('file2.txt'))).toBe(true)
    expect(files.some(f => f.endsWith('file3.txt'))).toBe(true)
  })

  it('应该在 recursive=false 时只获取顶层文件', () => {
    const testDir = path.join(tempDir, 'files-test')
    const files = getFiles(testDir, false)

    expect(files).toHaveLength(1)
    expect(files[0].endsWith('file1.txt')).toBe(true)
  })

  it('应该返回空数组当目录不存在时', () => {
    const files = getFiles(path.join(tempDir, 'non-existing'))
    expect(files).toEqual([])
  })
})

describe('getTemplatesDir', () => {
  it('应该返回模板目录的绝对路径', () => {
    const templatesDir = getTemplatesDir()
    expect(path.isAbsolute(templatesDir)).toBe(true)
    expect(templatesDir).toContain('templates')
  })
})

describe('getRelativePath', () => {
  it('应该返回相对路径', () => {
    const from = '/home/user/project'
    const to = '/home/user/project/src/index.ts'
    const result = getRelativePath(from, to)

    expect(result).toBe(path.join('src', 'index.ts'))
  })

  it('应该处理同级路径', () => {
    const from = '/home/user/project/src'
    const to = '/home/user/project/tests'
    const result = getRelativePath(from, to)

    expect(result).toContain('..')
    expect(result).toContain('tests')
  })
})
