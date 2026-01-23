/**
 * Feature 组合 E2E 测试
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
  resolveImportPathInTemplate,
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
import {
  findCatalogReferences,
  readPackageJson,
  validateDependencies,
} from './helpers/dependency-validator'

// __test__ 目录在项目根目录下，所以需要向上一级
const __dirname = path.dirname(fileURLToPath(import.meta.url))
// __dirname 是 __test__/e2e/featureCombination，需要向上三级到项目根目录
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates')

// 🔍 自动扫描生成测试配置（基于文件系统）
const TEST_CONFIGS = generateTestConfigs()

// 收集所有临时目录，在测试结束后统一清理
const tempDirsToCleanup: string[] = []

/**
 * 获取执行 npm scripts 的命令参数
 * npm 需要 `npm run <script>`，而 pnpm 可以直接 `pnpm <script>`
 * @param packageManager - 包管理器名称
 * @param script - 脚本名称
 * @returns 命令参数数组
 */
function getRunArgs(packageManager: string, script: string): string[] {
  return packageManager === 'npm' ? ['run', script] : [script]
}

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

  // 使用 describe.concurrent 并行执行不同项目配置的测试
  describe.concurrent(`${frameworkName} 项目`, () => {
    for (const testConfig of configs) {
      describe(testConfig.name, () => {
        let projectDir: string
        let packageManager: string

        beforeAll(async () => {
          projectDir = await createTempDir(`test-${testConfig.name}-`)
          const config: ProjectConfigType = {
            ...testConfig.config as ProjectConfigType,
            targetDir: projectDir,
          }
          // 保存包管理器配置，供测试使用
          packageManager = config.packageManager || 'pnpm'
          await generateProject(config)
        })

        afterAll(() => {
          // 将目录添加到待清理列表，测试结束后统一清理
          // 这样清理失败不会打断测试流程
          tempDirsToCleanup.push(projectDir)
        })

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

          // 验证 packageManager 字段
          const expectedPackageManager = testConfig.config.packageManager
          if (expectedPackageManager) {
            expect(packageJson.packageManager).toBeDefined()
            expect(packageJson.packageManager).toMatch(new RegExp(`^${expectedPackageManager}@`))
          }
        })

        it('应该成功安装依赖', async () => {
          console.log(`📦 使用包管理器: ${packageManager}`)
          const { exitCode, stderr } = await execa(packageManager, ['install'], {
            cwd: projectDir,
            reject: false,
          })

          if (exitCode !== 0) {
            console.error(`依赖安装失败 (${packageManager}):`, stderr)
          }

          expect(exitCode).toBe(0)
        })

        it('应该通过类型检查', async () => {
          const { exitCode, stdout, stderr } = await execa(packageManager, getRunArgs(packageManager, 'type-check'), {
            cwd: projectDir,
            reject: false,
          })

          if (exitCode !== 0) {
            console.error('类型检查失败:')
            console.error('标准输出:', stdout)
            console.error('错误输出:', stderr)
          }

          expect(exitCode).toBe(0)
        })

        it('应该通过代码检查', async () => {
          if (!testConfig.config.eslint) {
            return
          }

          const { exitCode, stderr } = await execa(packageManager, getRunArgs(packageManager, 'lint:eslint'), {
            cwd: projectDir,
            reject: false,
          })

          if (exitCode !== 0) {
            console.error('代码检查失败:', stderr)
          }

          expect(exitCode).toBe(0)
        })

        it('应该成功构建', async () => {
          const { exitCode, stdout, stderr } = await execa(packageManager, getRunArgs(packageManager, 'build'), {
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
        })

        it('应该有有效的构建输出', async () => {
          const outDir = await getViteOutDir(projectDir, 'production')
          const distDir = path.join(projectDir, outDir)

          if (!fs.existsSync(distDir)) {
            expect.fail(`未找到 ${outDir} 目录`)
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

        it('应该通过依赖验证', async () => {
          // 1. 验证目录引用已解析（catalog: 引用应该被解析为实际版本）
          const packageJson = await readPackageJson(projectDir)
          const catalogRefs = findCatalogReferences(packageJson)

          if (catalogRefs.length > 0) {
            expect.fail(`发现未解析的目录引用:\n${catalogRefs.join('\n')}`)
          }
          expect(catalogRefs).toEqual([])

          // 2. 验证条件依赖（如果禁用了某个功能，不应该有相关依赖）
          const validationOptions: Parameters<typeof validateDependencies>[1] = {
            shouldNotHave: [],
          }

          // 根据配置决定不应该存在的依赖
          if (!testConfig.config.eslint) {
            validationOptions.shouldNotHave!.push('@moluoxixi/eslint-config', 'eslint')
          }

          if (!testConfig.config.i18n) {
            if (testConfig.config.framework === 'vue') {
              validationOptions.shouldNotHave!.push('vue-i18n')
            }
            else if (testConfig.config.framework === 'react') {
              validationOptions.shouldNotHave!.push('react-i18next')
            }
          }

          // 3. 验证必需的基础依赖
          validationOptions.required = ['@moluoxixi/ajax-package']
          validationOptions.devRequired = ['@moluoxixi/vite-config']

          if (testConfig.config.eslint) {
            validationOptions.devRequired!.push('@moluoxixi/eslint-config')
          }

          const result = await validateDependencies(projectDir, validationOptions)

          if (!result.valid) {
            const errors: string[] = []
            if (result.missingDeps.length > 0) {
              errors.push(`缺失的依赖: ${result.missingDeps.join(', ')}`)
            }
            if (result.unexpectedDeps.length > 0) {
              errors.push(`不应该存在的依赖: ${result.unexpectedDeps.join(', ')}`)
            }
            if (result.versionMismatches.length > 0) {
              errors.push(`版本不匹配: ${result.versionMismatches.map(v => `${v.package} (期望: ${v.expected}, 实际: ${v.actual})`).join(', ')}`)
            }
            if (result.peerDepIssues.length > 0) {
              errors.push(`Peer 依赖问题: ${result.peerDepIssues.join(', ')}`)
            }
            expect.fail(`依赖验证失败:\n${errors.join('\n')}`)
          }

          expect(result.valid).toBe(true)
        })
      })
    }
  })
}

// 模板验证与功能组合测试
describe('模板验证与功能组合测试', () => {
  const { templates, errors: structureErrors } = checkBaseAndFeatures(TEMPLATES_DIR)

  // 测试结束后统一清理所有临时目录
  afterAll(async () => {
    if (tempDirsToCleanup.length === 0) {
      return
    }

    console.log(`\n🧹 清理 ${tempDirsToCleanup.length} 个临时测试目录...`)
    const results = await Promise.allSettled(
      tempDirsToCleanup.map(dir => cleanupTempDir(dir)),
    )

    const failed = results.filter(r => r.status === 'rejected')
    if (failed.length > 0) {
      console.warn(`⚠️ ${failed.length} 个目录清理失败（Windows 文件锁定），系统会自动清理`)
    }
    else {
      console.log('✅ 所有临时目录已清理')
    }
  })

  // 1. 检查 common 和框架中是否存在 base 和可选 feature
  describe('结构完整性检查', () => {
    it('所有必需的 base 目录应该存在（common/base、框架 base、微前端 base）', () => {
      if (structureErrors.length > 0) {
        expect.fail(`结构检查失败:\n${structureErrors.join('\n')}`)
      }
      expect(structureErrors).toEqual([])
    })

    it('constants 中维护的所有 feature 应该存在', () => {
      const { errors: constantsErrors } = checkConstantsFeatures(TEMPLATES_DIR)
      if (constantsErrors.length > 0) {
        expect.fail(`constants feature 检查失败:\n${constantsErrors.join('\n')}`)
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
              // 解析路径到实际文件路径（resolveImportPathInTemplate 内部会处理补后缀和文件存在性检查）
              const resolvedFile = resolveImportPathInTemplate(
                file,
                imp.path,
                template,
                TEMPLATES_DIR,
              )

              // 1. 检查跨模板导入（解析后的文件路径是否在当前模板范围内）
              if (resolvedFile && !resolvedFile.startsWith(template.path)) {
                const relativePath = path.relative(TEMPLATES_DIR, file)
                const importedPath = path.relative(TEMPLATES_DIR, resolvedFile)
                crossTemplateImportErrors.push(
                  `${relativePath}:${imp.line} - 跨模板导入不允许: "${imp.path}" (解析到: ${importedPath})`,
                )
                continue // 跳过后续的文件存在性检查
              }

              // 2. 检查文件是否存在（如果返回 null，说明文件不存在或无法解析）
              if (!resolvedFile) {
                const relativePath = path.relative(TEMPLATES_DIR, file)
                fileImportErrors.push(
                  `${relativePath}:${imp.line} - File not found: "${imp.path}"`,
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
            const errorMessage = `发现 ${fileImportErrors.length} 个文件导入错误：\n${fileImportErrors.join('\n')}`
            expect.fail(errorMessage)
          }
          else {
            expect(fileImportErrors.length).toBe(0)
          }
        })

        it(`应该只从当前模板导入（无跨模板导入）- ${template.name}${crossTemplateImportErrors.length > 0 ? ` (${crossTemplateImportErrors.length} 个错误)` : ' (通过)'}`, () => {
          if (crossTemplateImportErrors.length > 0) {
            const errorMessage = `发现 ${crossTemplateImportErrors.length} 个跨模板导入：\n${crossTemplateImportErrors.slice(0, 10).join('\n')}${crossTemplateImportErrors.length > 10 ? `\n... 还有 ${crossTemplateImportErrors.length - 10} 个` : ''}`
            expect.fail(errorMessage)
          }
          else {
            expect(crossTemplateImportErrors.length).toBe(0)
          }
        })

        it(`所有包导入都应该在 package.json 中声明 - ${template.name}${packageImportErrors.length > 0 ? ` (${packageImportErrors.length} 个错误)` : ' (通过)'}`, () => {
          if (packageImportErrors.length > 0) {
            const summary = `缺失的包: ${Array.from(missingPackages).join(', ')}`
            const errorMessage = `发现 ${packageImportErrors.length} 个包导入声明错误：\n${summary}\n\n${packageImportErrors.slice(0, 10).join('\n')}${packageImportErrors.length > 10 ? `\n... 还有 ${packageImportErrors.length - 10} 个` : ''}`
            expect.fail(errorMessage)
          }
          else {
            expect(packageImportErrors.length).toBe(0)
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
        expect.fail(`结构检查失败:\n${structureErrors.join('\n')}`)
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
