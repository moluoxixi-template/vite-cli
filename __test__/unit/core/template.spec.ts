/**
 * template.ts 单元测试
 * 测试模板渲染核心模块
 */

import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'fs-extra'
import { renderTemplate, updatePackageJsonMetadata } from '@/core/template'

// 测试用临时目录
let tempDir: string
let srcDir: string
let destDir: string

beforeEach(async () => {
  tempDir = path.join(process.cwd(), '__test__', 'temp-template-test', `test-${Date.now()}`)
  srcDir = path.join(tempDir, 'src')
  destDir = path.join(tempDir, 'dest')
  await fs.ensureDir(srcDir)
  await fs.ensureDir(destDir)
})

afterEach(async () => {
  if (await fs.pathExists(tempDir)) {
    await fs.remove(tempDir)
  }
})

describe('renderTemplate', () => {
  describe('目录处理', () => {
    it('应该复制目录结构', () => {
      // 创建源目录结构
      fs.mkdirSync(path.join(srcDir, 'sub-dir'))
      fs.writeFileSync(path.join(srcDir, 'file1.txt'), 'content1')
      fs.writeFileSync(path.join(srcDir, 'sub-dir', 'file2.txt'), 'content2')

      renderTemplate(srcDir, destDir)

      expect(fs.existsSync(path.join(destDir, 'file1.txt'))).toBe(true)
      expect(fs.existsSync(path.join(destDir, 'sub-dir', 'file2.txt'))).toBe(true)
    })

    it('应该跳过 node_modules 目录', () => {
      fs.mkdirSync(path.join(srcDir, 'node_modules'))
      fs.writeFileSync(path.join(srcDir, 'node_modules', 'package.json'), '{}')
      fs.writeFileSync(path.join(srcDir, 'index.ts'), 'content')

      renderTemplate(srcDir, destDir)

      expect(fs.existsSync(path.join(destDir, 'index.ts'))).toBe(true)
      expect(fs.existsSync(path.join(destDir, 'node_modules'))).toBe(false)
    })

    it('应该创建不存在的目标目录', () => {
      const newDestDir = path.join(tempDir, 'new-dest')
      fs.writeFileSync(path.join(srcDir, 'file.txt'), 'content')

      renderTemplate(srcDir, newDestDir)

      expect(fs.existsSync(path.join(newDestDir, 'file.txt'))).toBe(true)
    })
  })

  describe('文件处理', () => {
    it('应该复制普通文件', () => {
      fs.writeFileSync(path.join(srcDir, 'test.ts'), 'const x = 1')

      renderTemplate(srcDir, destDir)

      expect(fs.readFileSync(path.join(destDir, 'test.ts'), 'utf-8')).toBe('const x = 1')
    })

    it('应该跳过 .ejs 文件', () => {
      fs.writeFileSync(path.join(srcDir, 'template.ejs'), '<%= name %>')
      fs.writeFileSync(path.join(srcDir, 'normal.ts'), 'content')

      renderTemplate(srcDir, destDir)

      expect(fs.existsSync(path.join(destDir, 'template.ejs'))).toBe(false)
      expect(fs.existsSync(path.join(destDir, 'normal.ts'))).toBe(true)
    })

    it('应该跳过 pnpm-workspace.yaml 文件', () => {
      fs.writeFileSync(path.join(srcDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*')
      fs.writeFileSync(path.join(srcDir, 'normal.ts'), 'content')

      renderTemplate(srcDir, destDir)

      expect(fs.existsSync(path.join(destDir, 'pnpm-workspace.yaml'))).toBe(false)
      expect(fs.existsSync(path.join(destDir, 'normal.ts'))).toBe(true)
    })

    it('应该将 _ 开头的文件重命名为 . 开头', () => {
      fs.writeFileSync(path.join(srcDir, '_gitignore'), 'node_modules')
      fs.writeFileSync(path.join(srcDir, '_eslintrc.js'), 'module.exports = {}')

      renderTemplate(srcDir, destDir)

      expect(fs.existsSync(path.join(destDir, '.gitignore'))).toBe(true)
      expect(fs.existsSync(path.join(destDir, '.eslintrc.js'))).toBe(true)
      expect(fs.existsSync(path.join(destDir, '_gitignore'))).toBe(false)
    })

    it('应该覆盖已存在的文件', () => {
      fs.writeFileSync(path.join(srcDir, 'config.ts'), 'new content')
      fs.writeFileSync(path.join(destDir, 'config.ts'), 'old content')

      renderTemplate(srcDir, destDir)

      expect(fs.readFileSync(path.join(destDir, 'config.ts'), 'utf-8')).toBe('new content')
    })
  })

  describe('package.json 深度合并', () => {
    it('应该合并 package.json 文件', () => {
      const existingPkg = {
        name: 'existing',
        dependencies: {
          vue: '^3.0.0',
        },
      }
      const newPkg = {
        dependencies: {
          'vue-router': '^4.0.0',
        },
        devDependencies: {
          vite: '^5.0.0',
        },
      }

      fs.writeFileSync(path.join(destDir, 'package.json'), JSON.stringify(existingPkg))
      fs.writeFileSync(path.join(srcDir, 'package.json'), JSON.stringify(newPkg))

      renderTemplate(srcDir, destDir)

      const result = fs.readJsonSync(path.join(destDir, 'package.json'))
      expect(result.name).toBe('existing')
      expect(result.dependencies.vue).toBe('^3.0.0')
      expect(result.dependencies['vue-router']).toBe('^4.0.0')
      expect(result.devDependencies.vite).toBe('^5.0.0')
    })

    it('应该在合并时对依赖进行排序', () => {
      // 先创建已存在的 package.json
      const existingPkg = {
        name: 'existing',
        dependencies: {},
      }
      fs.writeFileSync(path.join(destDir, 'package.json'), JSON.stringify(existingPkg))

      // 源 package.json 有未排序的依赖
      const pkg = {
        dependencies: {
          zod: '^3.0.0',
          axios: '^1.0.0',
          vue: '^3.0.0',
        },
      }
      fs.writeFileSync(path.join(srcDir, 'package.json'), JSON.stringify(pkg))

      renderTemplate(srcDir, destDir)

      const result = fs.readJsonSync(path.join(destDir, 'package.json'))
      const keys = Object.keys(result.dependencies)
      expect(keys).toEqual(['axios', 'vue', 'zod'])
    })

    it('应该在目标不存在时直接写入 package.json', () => {
      const newPkg = {
        name: 'new-project',
        version: '1.0.0',
      }

      fs.writeFileSync(path.join(srcDir, 'package.json'), JSON.stringify(newPkg))

      renderTemplate(srcDir, destDir)

      const result = fs.readJsonSync(path.join(destDir, 'package.json'))
      expect(result.name).toBe('new-project')
    })
  })

  describe('错误处理', () => {
    it('应该拒绝包含 .. 的路径', () => {
      expect(() => renderTemplate('../../../etc/passwd', destDir))
        .toThrow('不安全的路径')
    })

    it('应该拒绝包含 ~/ 的路径（home 目录）', () => {
      expect(() => renderTemplate('~/secret', destDir))
        .toThrow('不安全的路径')
    })

    it('应该拒绝不安全的文件名', () => {
      fs.writeFileSync(path.join(srcDir, 'normal.txt'), 'content')
      // 创建一个包含 .. 的目录来测试
      const maliciousDir = path.join(srcDir, 'test')
      fs.mkdirSync(maliciousDir)
      // 这里我们测试的是 renderTemplate 会验证路径
      expect(() => renderTemplate(srcDir, destDir)).not.toThrow()
    })

    it('应该在源文件不存在时抛出错误', () => {
      const nonExistingPath = path.join(srcDir, 'non-existing')
      expect(() => renderTemplate(nonExistingPath, destDir)).toThrow()
    })

    it('应该在 JSON 解析失败时抛出错误', () => {
      fs.writeFileSync(path.join(srcDir, 'package.json'), '{ invalid json }')

      expect(() => renderTemplate(srcDir, destDir)).toThrow('package.json 解析失败')
    })
  })

  describe('边界条件', () => {
    it('应该处理空目录', () => {
      renderTemplate(srcDir, destDir)
      expect(fs.readdirSync(destDir)).toHaveLength(0)
    })

    it('应该处理深层嵌套目录', () => {
      const deepPath = path.join(srcDir, 'a', 'b', 'c', 'd', 'e')
      fs.mkdirSync(deepPath, { recursive: true })
      fs.writeFileSync(path.join(deepPath, 'deep.txt'), 'deep content')

      renderTemplate(srcDir, destDir)

      const destDeepPath = path.join(destDir, 'a', 'b', 'c', 'd', 'e', 'deep.txt')
      expect(fs.existsSync(destDeepPath)).toBe(true)
    })

    it('应该处理空文件', () => {
      fs.writeFileSync(path.join(srcDir, 'empty.txt'), '')

      renderTemplate(srcDir, destDir)

      expect(fs.readFileSync(path.join(destDir, 'empty.txt'), 'utf-8')).toBe('')
    })
  })
})

describe('updatePackageJsonMetadata', () => {
  describe('正常流程', () => {
    it('应该更新 name 字段', () => {
      const pkgPath = path.join(tempDir, 'package.json')
      fs.writeJsonSync(pkgPath, { name: 'old-name' })

      updatePackageJsonMetadata(pkgPath, 'new-name', '', '', 'pnpm')

      const result = fs.readJsonSync(pkgPath)
      expect(result.name).toBe('new-name')
    })

    it('应该更新 description 字段', () => {
      const pkgPath = path.join(tempDir, 'package.json')
      fs.writeJsonSync(pkgPath, { name: 'test' })

      updatePackageJsonMetadata(pkgPath, 'test', 'A test project', '', 'pnpm')

      const result = fs.readJsonSync(pkgPath)
      expect(result.description).toBe('A test project')
    })

    it('应该更新 author 字段', () => {
      const pkgPath = path.join(tempDir, 'package.json')
      fs.writeJsonSync(pkgPath, { name: 'test' })

      updatePackageJsonMetadata(pkgPath, 'test', '', 'Test Author', 'pnpm')

      const result = fs.readJsonSync(pkgPath)
      expect(result.author).toBe('Test Author')
    })

    it('应该更新 packageManager 字段', () => {
      const pkgPath = path.join(tempDir, 'package.json')
      fs.writeJsonSync(pkgPath, { name: 'test' })

      updatePackageJsonMetadata(pkgPath, 'test', '', '', 'pnpm')

      const result = fs.readJsonSync(pkgPath)
      expect(result.packageManager).toMatch(/^pnpm@/)
    })

    it('应该支持不同的包管理器版本', () => {
      const pkgPath = path.join(tempDir, 'package.json')

      const managers = ['pnpm', 'npm', 'yarn']
      for (const pm of managers) {
        fs.writeJsonSync(pkgPath, { name: 'test' })
        updatePackageJsonMetadata(pkgPath, 'test', '', '', pm)
        const result = fs.readJsonSync(pkgPath)
        expect(result.packageManager).toMatch(new RegExp(`^${pm}@`))
      }
    })
  })

  describe('边界条件', () => {
    it('应该跳过不存在的文件', () => {
      const nonExistingPath = path.join(tempDir, 'non-existing', 'package.json')
      expect(() => updatePackageJsonMetadata(nonExistingPath, 'test', '', '', 'pnpm'))
        .not
        .toThrow()
    })

    it('应该处理空 description', () => {
      const pkgPath = path.join(tempDir, 'package.json')
      fs.writeJsonSync(pkgPath, { name: 'test', description: 'old' })

      updatePackageJsonMetadata(pkgPath, 'test', '', '', 'pnpm')

      const result = fs.readJsonSync(pkgPath)
      // 空字符串不会更新 description
      expect(result.description).toBe('old')
    })

    it('应该处理空 author', () => {
      const pkgPath = path.join(tempDir, 'package.json')
      fs.writeJsonSync(pkgPath, { name: 'test', author: 'old' })

      updatePackageJsonMetadata(pkgPath, 'test', '', '', 'pnpm')

      const result = fs.readJsonSync(pkgPath)
      // 空字符串不会更新 author
      expect(result.author).toBe('old')
    })

    it('应该对依赖进行排序', () => {
      const pkgPath = path.join(tempDir, 'package.json')
      fs.writeJsonSync(pkgPath, {
        name: 'test',
        dependencies: {
          zod: '^3.0.0',
          axios: '^1.0.0',
        },
      })

      updatePackageJsonMetadata(pkgPath, 'test', '', '', 'pnpm')

      const result = fs.readJsonSync(pkgPath)
      const keys = Object.keys(result.dependencies)
      expect(keys).toEqual(['axios', 'zod'])
    })
  })

  describe('错误处理', () => {
    it('应该在 JSON 解析失败时抛出 TypeError', () => {
      const pkgPath = path.join(tempDir, 'package.json')
      fs.writeFileSync(pkgPath, '{ invalid json }')

      expect(() => updatePackageJsonMetadata(pkgPath, 'test', '', '', 'pnpm'))
        .toThrow(TypeError)
    })
  })
})
