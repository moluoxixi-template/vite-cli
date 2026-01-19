/**
 * Feature 组合集成测试
 * 包含模板完整性检查和功能组合测试
 * 基于文件系统自动扫描 templates/ 目录，生成所有测试组合
 * 当添加新的 template feature 时，测试会自动覆盖
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import { FRAMEWORKS } from '@/constants'
import {
  checkPackageInDependencies,
  extractImports,
  resolveImportPath,
  scanAllImports,
} from './helpers/import-validator'
import {
  checkBaseAndFeatures,
  checkConstantsFeatures,
  scanSourceFiles,
} from './helpers/template-validator'
import {
  cleanupTempDir,
  createTempDir,
} from '@test/test-utils'
import { generateTestConfigs } from './helpers/test-config-generator'

// __test__ 目录在项目根目录下，所以需要向上一级
const __dirname = path.dirname(fileURLToPath(import.meta.url))
// __dirname 是 __test__/integration，需要向上两级到项目根目录
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates')

// 🔍 自动扫描生成测试配置（基于文件系统）
const TEST_CONFIGS = generateTestConfigs()

/**
 * 为指定框架生成测试套件
 * @param frameworkName 框架名称（用于显示）
 * @param configs 测试配置数组
 */
function createFrameworkTests(frameworkName: string, configs: typeof TEST_CONFIGS) {
  if (configs.length === 0) {
    return
  }

  describe(`${frameworkName} 项目`, () => {
    for (const testConfig of configs) {
      describe(testConfig.name, () => {
        let projectDir: string

        beforeAll(async () => {
          projectDir = await createTempDir(`test-${testConfig.name}-`)
          const config: ProjectConfigType = {
            ...testConfig.config as ProjectConfigType,
            targetDir: projectDir,
          }
          await generateProject(config)
        }, 60000)

        afterAll(async () => {
          await cleanupTempDir(projectDir)
        })

        it(`应该只从自己的包导入（无跨模板导入）- ${testConfig.name}`, async () => {
          const imports = await scanAllImports(projectDir)

          // 找出所有跨模板的 import（不允许引用其他模板）
          const crossTemplateImports = imports.filter(imp =>
            imp.includes('../../templates/')
            || imp.includes('../../../common/')
            || imp.includes('../../../vue/')
            || imp.includes('../../../react/'),
          )

          if (crossTemplateImports.length > 0) {
            throw new Error(`发现 ${crossTemplateImports.length} 个跨模板导入:\n${crossTemplateImports.slice(0, 10).join('\n')}${crossTemplateImports.length > 10 ? `\n... 还有 ${crossTemplateImports.length - 10} 个` : ''}`)
          }

          expect(crossTemplateImports).toEqual([])
        })
      })
    }
  })
}

// 模板验证与功能组合测试
describe('模板验证与功能组合测试', () => {
  const { templates, errors: structureErrors } = checkBaseAndFeatures(TEMPLATES_DIR)

  // 1. 检查 common 和框架中是否存在 base 和可选 feature
  describe('结构完整性检查', () => {
    it('所有必需的 base 目录应该存在（common/base、框架 base、微前端 base）', () => {
      if (structureErrors.length > 0) {
        throw new Error(`结构检查失败:\n${structureErrors.join('\n')}`)
      }
      expect(structureErrors).toEqual([])
    })

    it('constants 中维护的所有 feature 应该存在', () => {
      const { errors: constantsErrors } = checkConstantsFeatures(TEMPLATES_DIR)
      if (constantsErrors.length > 0) {
        throw new Error(`constants feature 检查失败:\n${constantsErrors.join('\n')}`)
      }
      expect(constantsErrors).toEqual([])
    })

    it('应该扫描所有预期的模板', () => {
      const templateNames = templates.map(t => t.name)

      // 至少应该有这些模板
      expect(templateNames).toContain('common/base')
      expect(templateNames).toContain('vue/base')

      console.log(`\n✅ Scanned ${templates.length} templates:`)
      for (const t of templates) {
        const fileCount = scanSourceFiles(t.path).length
        console.log(`   - ${t.name} (${fileCount} files)`)
      }
    })
  })

  // 2. 检查微前端结构
  describe('微前端结构检查', () => {
    for (const framework of FRAMEWORKS) {
      const microFrontendsDir = path.join(TEMPLATES_DIR, framework, 'micro-frontends')
      if (fs.existsSync(microFrontendsDir)) {
        const engines = fs.readdirSync(microFrontendsDir).filter((item) => {
          const itemPath = path.join(microFrontendsDir, item)
          return fs.statSync(itemPath).isDirectory()
        })

        for (const engine of engines) {
          it(`${framework}/micro-frontends/${engine} 应该有 base 目录`, () => {
            const basePath = path.join(microFrontendsDir, engine, 'base')
            expect(fs.existsSync(basePath)).toBe(true)
          })

          it(`${framework}/micro-frontends/${engine} 可以有 features 目录`, () => {
            const featuresDir = path.join(microFrontendsDir, engine, 'features')
            // features 是可选的，所以只检查如果存在则应该是目录
            if (fs.existsSync(featuresDir)) {
              expect(fs.statSync(featuresDir).isDirectory()).toBe(true)
            }
          })
        }
      }
    }
  })

  // 3. 扫描所有 feature 和 base 目录，检查文件导入
  describe('文件导入检查', () => {
    const { templates: allTemplates } = checkBaseAndFeatures(TEMPLATES_DIR)
    for (const template of allTemplates) {
      describe(template.name, () => {
        const sourceFiles = scanSourceFiles(template.path)

        it(`应该有源代码文件 - ${template.name} (${sourceFiles.length} 个文件)`, () => {
          if (sourceFiles.length === 0) {
            console.log(`\n❌ No files found in: ${template.path}`)
            console.log(`   Exists: ${fs.existsSync(template.path)}`)
            if (fs.existsSync(template.path)) {
              const contents = fs.readdirSync(template.path)
              console.log(`   Contents: ${contents.join(', ')}`)
            }
          }
          expect(sourceFiles.length).toBeGreaterThan(0)
        })

        // 先遍历所有文件收集错误
        const fileImportErrors: string[] = []
        const packageImportErrors: string[] = []
        const missingPackages = new Set<string>()

        for (const file of sourceFiles) {
          const content = fs.readFileSync(file, 'utf-8')
          const imports = extractImports(content, template, TEMPLATES_DIR)

          for (const imp of imports) {
            // 检查文件导入（相对路径和路径别名）
            if (imp.type === 'relative' || imp.type === 'alias') {
              const resolved = resolveImportPath(file, imp.path, template, TEMPLATES_DIR)

              if (!resolved || !fs.existsSync(resolved)) {
                const relativePath = path.relative(TEMPLATES_DIR, file)
                const resolvedInfo = resolved ? path.relative(TEMPLATES_DIR, resolved) : 'unresolved'
                fileImportErrors.push(
                  `${relativePath}:${imp.line} - File not found: "${imp.path}" (resolved: ${resolvedInfo})`,
                )
              }
            }
            // 检查包导入
            else if (imp.type === 'package') {
              // 只跳过内置 Node.js 模块
              const builtinModules = ['fs', 'path', 'url', 'crypto', 'http', 'https', 'os', 'util', 'events', 'stream']
              if (imp.path.startsWith('node:') || builtinModules.includes(imp.path)) {
                continue
              }

              if (!checkPackageInDependencies(imp.path, template.packageJsonPath)) {
                missingPackages.add(imp.path)
                const relativePath = path.relative(TEMPLATES_DIR, file)
                packageImportErrors.push(
                  `${relativePath}:${imp.line} - Package "${imp.path}" not declared in package.json`,
                )
              }
            }
            // 虚拟模块不需要在 package.json 中声明（由插件生成）
            // 但会在文件导入检查中验证其他方面
          }
        }

        it(`应该有有效的文件导入 - ${template.name}${fileImportErrors.length > 0 ? ` (${fileImportErrors.length} 个错误)` : ' (通过)'}`, () => {
          if (fileImportErrors.length > 0) {
            throw new Error(`Found ${fileImportErrors.length} missing file imports:\n${fileImportErrors.join('\n')}`)
          }
        })

        it(`所有包导入都应该在 package.json 中声明 - ${template.name}${packageImportErrors.length > 0 ? ` (${packageImportErrors.length} 个错误)` : ' (通过)'}`, () => {
          if (packageImportErrors.length > 0) {
            const summary = `Missing packages: ${Array.from(missingPackages).join(', ')}`
            throw new Error(`Found ${packageImportErrors.length} missing package declarations:\n${summary}\n\n${packageImportErrors.slice(0, 10).join('\n')}${packageImportErrors.length > 10 ? `\n... and ${packageImportErrors.length - 10} more` : ''}`)
          }
        })
      })
    }
  })

  // 4. 功能组合集成测试（只有前置检查通过后才执行）
  describe('功能组合集成测试（基于文件系统）', () => {
    // 如果结构检查失败，跳过所有测试
    if (structureErrors.length > 0) {
      it.skip('跳过测试：结构检查失败', () => {
        throw new Error(`结构检查失败:\n${structureErrors.join('\n')}`)
      })
      return
    }

    // 按框架动态分组
    const frameworkGroups = new Map<string, typeof TEST_CONFIGS>()
    for (const config of TEST_CONFIGS) {
      const framework = config.config.framework
      if (!framework) {
        continue
      }
      if (!frameworkGroups.has(framework)) {
        frameworkGroups.set(framework, [])
      }
      frameworkGroups.get(framework)!.push(config)
    }

    // 输出统计信息
    const frameworkStats = Array.from(frameworkGroups.entries())
      .map(([framework, configs]) => `  - ${framework}: ${configs.length} 个`)
      .join('\n')
    console.log(`\n🔍 自动扫描生成 ${TEST_CONFIGS.length} 个测试用例:`)
    console.log(frameworkStats)
    console.log()

    // 为每个框架生成测试
    for (const [framework, configs] of frameworkGroups.entries()) {
      createFrameworkTests(framework, configs)
    }
  })
})
