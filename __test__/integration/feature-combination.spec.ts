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
import { execa } from 'execa'
import { resolveConfig } from 'vite'
import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import { FRAMEWORKS } from '@/constants'
import {
  checkPackageInDependencies,
  extractImports,
  resolveImportPath,
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
 * 获取 Vite 配置中的输出目录
 * @param projectRoot - 项目根目录路径
 * @param mode - 构建模式，默认为 'production'
 * @returns 输出目录路径，如果未配置则返回 'dist'
 */
async function getViteOutDir(projectRoot: string, mode: string = 'production'): Promise<string> {
  try {
    const viteConfig = await resolveConfig({ root: projectRoot }, 'build', mode)
    const outDir = viteConfig.build.outDir

    if (outDir) {
      return outDir
    }

    // 如果未配置，返回默认值
    return 'dist'
  }
  catch (error) {
    console.warn('Failed to load vite config, using default outDir:', error)
    return 'dist'
  }
}

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
        }, 120000)

        afterAll(async () => {
          // 清理测试项目（注意：如果需要调试，可以注释掉这行）
          await cleanupTempDir(projectDir)
        }, 120000)

        it('应该存在 package.json 文件', () => {
          const packageJsonPath = path.join(projectDir, 'package.json')
          expect(fs.existsSync(packageJsonPath)).toBe(true)
        })

        it('应该有有效的 package.json 结构和元数据', async () => {
          const packageJson = await fs.readJson(path.join(projectDir, 'package.json'))

          // 验证 package.json 基本结构
          expect(packageJson.type).toBe('module')
          expect(packageJson.scripts).toBeDefined()
          expect(packageJson.dependencies).toBeDefined()
          expect(packageJson.devDependencies).toBeDefined()

          // 验证项目元数据
          expect(packageJson.name).toBe(testConfig.config.projectName)
          expect(packageJson.description).toBe(testConfig.config.description)
          expect(packageJson.author).toBe(testConfig.config.author)
        })

        it('应该成功安装依赖', async () => {
          const { exitCode, stderr } = await execa('pnpm', ['install'], {
            cwd: projectDir,
            reject: false,
          })

          if (exitCode !== 0) {
            console.error('依赖安装失败:', stderr)
          }

          expect(exitCode).toBe(0)
        }, 180000) // 3 minutes timeout

        it('应该通过类型检查', async () => {
          const { exitCode, stdout, stderr } = await execa('pnpm', ['type-check'], {
            cwd: projectDir,
            reject: false,
          })

          if (exitCode !== 0) {
            console.error('类型检查失败:')
            console.error('标准输出:', stdout)
            console.error('错误输出:', stderr)
          }

          expect(exitCode).toBe(0)
        }, 120000)

        it('应该通过代码检查', async () => {
          if (!testConfig.config.eslint) {
            return
          }

          const { exitCode, stderr } = await execa('pnpm', ['lint:eslint'], {
            cwd: projectDir,
            reject: false,
          })

          if (exitCode !== 0) {
            console.error('代码检查失败:', stderr)
          }

          expect(exitCode).toBe(0)
        }, 120000)

        it('应该成功构建', async () => {
          const { exitCode, stdout, stderr } = await execa('pnpm', ['build'], {
            cwd: projectDir,
            reject: false,
          })

          const outDir = await getViteOutDir(projectDir, 'production')
          const distDir = path.join(projectDir, outDir)
          const distExists = fs.existsSync(distDir)

          if (exitCode !== 0 || !distExists) {
            console.error('构建失败:')
            console.error('退出码:', exitCode)
            console.error('标准输出:', stdout)
            console.error('错误输出:', stderr)
            if (!distExists) {
              console.error(`${outDir} 目录不存在`)
            }
          }

          expect(exitCode).toBe(0)

          // 检查构建输出目录是否生成
          expect(distExists).toBe(true)
        }, 180000) // 3 minutes timeout

        it('应该有有效的构建输出', async () => {
          const outDir = await getViteOutDir(projectDir, 'production')
          const distDir = path.join(projectDir, outDir)

          if (!fs.existsSync(distDir)) {
            throw new Error(`未找到 ${outDir} 目录`)
          }

          const files = await fs.readdir(distDir)

          // 检查是否有 index.html
          expect(files).toContain('index.html')

          // 检查是否有 assets 或 static 目录，或者有 .js/.css 文件
          const hasAssets = files.some((f) => {
            const fullPath = path.join(distDir, f)
            const stat = fs.statSync(fullPath)
            return f.startsWith('assets') || f.startsWith('static') || f.endsWith('.js') || f.endsWith('.css') || (stat.isDirectory() && (f === 'assets' || f === 'static'))
          })
          expect(hasAssets).toBe(true)
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
        const crossTemplateImportErrors: string[] = []
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
              // 检查导入的文件是否在当前模板范围内（不允许跨模板导入）
              else if (resolved && !resolved.startsWith(template.path)) {
                const relativePath = path.relative(TEMPLATES_DIR, file)
                const importedPath = path.relative(TEMPLATES_DIR, resolved)
                crossTemplateImportErrors.push(
                  `${relativePath}:${imp.line} - 跨模板导入不允许: "${imp.path}" (导入自: ${importedPath})`,
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

        it(`应该只从当前模板导入（无跨模板导入）- ${template.name}${crossTemplateImportErrors.length > 0 ? ` (${crossTemplateImportErrors.length} 个错误)` : ' (通过)'}`, () => {
          if (crossTemplateImportErrors.length > 0) {
            throw new Error(`Found ${crossTemplateImportErrors.length} cross-template imports:\n${crossTemplateImportErrors.slice(0, 10).join('\n')}${crossTemplateImportErrors.length > 10 ? `\n... and ${crossTemplateImportErrors.length - 10} more` : ''}`)
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
