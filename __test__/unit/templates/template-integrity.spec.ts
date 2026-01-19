/**
 * 模板完整性测试
 * 扫描模板文件，验证 import 引用的文件/依赖是否存在
 */

import path from 'node:path'
import fs from 'fs-extra'
import { describe, expect, it } from 'vitest'

// __test__ 目录在项目根目录下，所以需要向上一级
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates')

/**
 * 提取文件中的所有 import 语句
 */
function extractImports(content: string): Array<{
  type: 'package' | 'relative' | 'alias' | 'virtual'
  path: string
  line: number
}> {
  const imports: Array<{
    type: 'package' | 'relative' | 'alias' | 'virtual'
    path: string
    line: number
  }> = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // 匹配 import 和 from 语句
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g
    const matches = line.matchAll(importRegex)

    for (const match of matches) {
      const importPath = match[1]

      let type: 'package' | 'relative' | 'alias' | 'virtual'
      if (importPath.startsWith('.')) {
        type = 'relative'
      }
      else if (importPath.startsWith('@/')) {
        type = 'alias'
      }
      else if (importPath.startsWith('~') || importPath.startsWith('virtual:')) {
        type = 'virtual'
      }
      else {
        type = 'package'
      }

      imports.push({
        type,
        path: importPath,
        line: i + 1,
      })
    }
  }

  return imports
}

/**
 * 读取模板的 tsconfig 路径配置（支持 extends）
 */
function getTsConfigPaths(templatePath: string, configPath?: string): Record<string, string[]> | null {
  const tsConfigPath = configPath || path.join(templatePath, 'tsconfig.app.json')

  if (!fs.existsSync(tsConfigPath)) {
    // 尝试 tsconfig.json
    const fallback = path.join(templatePath, 'tsconfig.json')
    if (fs.existsSync(fallback)) {
      return getTsConfigPaths(templatePath, fallback)
    }
    return null
  }

  try {
    const tsConfig = fs.readJsonSync(tsConfigPath)
    let paths = tsConfig.compilerOptions?.paths || null

    // 如果没有 paths，尝试从 extends 读取
    if (!paths && tsConfig.extends) {
      const extendsPath = path.resolve(path.dirname(tsConfigPath), tsConfig.extends)
      if (fs.existsSync(extendsPath)) {
        const extendedPaths = getTsConfigPaths(templatePath, extendsPath)
        if (extendedPaths) {
          paths = extendedPaths
        }
      }
    }

    return paths
  }
  catch {
    return null
  }
}

/**
 * 获取模板的依赖路径（模拟合并后的结构）
 * common/base + framework/base + framework/features/*
 */
function getTemplateDependencyPaths(template: { name: string, path: string }): string[] {
  const searchPaths = [template.path]

  // 如果是 framework base 或 feature，需要包含 common/base
  if (!template.name.startsWith('common/')) {
    searchPaths.push(path.join(TEMPLATES_DIR, 'common/base'))
  }

  // 如果是 feature，需要包含对应的 framework base
  if (template.name.includes('/features/')) {
    const framework = template.name.split('/')[0] // vue 或 react
    searchPaths.push(path.join(TEMPLATES_DIR, framework, 'base'))
  }

  return searchPaths
}

/**
 * 解析路径别名（如 @/），支持跨模板依赖
 */
function resolveAliasPath(
  template: { name: string, path: string },
  aliasPath: string,
): string | null {
  const paths = getTsConfigPaths(template.path)

  // 获取所有可能的搜索路径（模拟合并后的结构）
  const searchPaths = getTemplateDependencyPaths(template)

  let relativePath: string | null = null

  if (paths) {
    // 使用 tsconfig paths 配置
    for (const [pattern, targets] of Object.entries(paths)) {
      const regex = new RegExp(`^${pattern.replace('*', '(.*)')}$`)
      const match = aliasPath.match(regex)

      if (match && targets.length > 0) {
        let targetPath = targets[0]
        if (match[1]) {
          targetPath = targetPath.replace('*', match[1])
        }
        relativePath = targetPath.replace(/^\.\//, '')
        break
      }
    }
    // 如果没有匹配到任何路径，返回 null
    if (relativePath === null)
      return null
  }
  else {
    // 默认规则：@/ 映射到 src/
    if (!aliasPath.startsWith('@/'))
      return null
    relativePath = aliasPath.replace('@/', 'src/')
  }

  // 在所有搜索路径中查找文件
  for (const searchPath of searchPaths) {
    const fullPath = path.join(searchPath, relativePath!)

    // 尝试常见的文件扩展名
    const extensions = [
      '',
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.vue',
      '.scss',
      '.sass',
      '.css',
      '.svg',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.webp',
      '/index.ts',
      '/index.tsx',
      '/index.js',
      '/index.vue',
    ]

    for (const ext of extensions) {
      const testPath = fullPath + ext
      if (fs.existsSync(testPath)) {
        return testPath
      }
    }
  }

  return null
}

/**
 * 解析相对路径或别名 import 的真实文件路径
 */
function resolveImportPath(
  currentFile: string,
  importPath: string,
  template: { name: string, path: string },
): string | null {
  if (importPath.startsWith('@/')) {
    // 解析路径别名（支持跨模板依赖）
    return resolveAliasPath(template, importPath)
  }
  else {
    // 解析相对路径
    const currentDir = path.dirname(currentFile)
    const resolved = path.resolve(currentDir, importPath)

    // 尝试添加常见的文件扩展名
    const extensions = [
      '',
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.vue',
      '.scss',
      '.sass',
      '.css',
      '.svg',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.webp',
      '/index.ts',
      '/index.tsx',
      '/index.js',
      '/index.vue',
    ]

    for (const ext of extensions) {
      const testPath = resolved + ext
      if (fs.existsSync(testPath)) {
        return testPath
      }
    }

    return null
  }
}

/**
 * 检查包导入是否在 package.json 中声明
 */
function checkPackageInDependencies(packageName: string, packageJsonPath: string): boolean {
  if (!fs.existsSync(packageJsonPath)) {
    return false
  }

  const packageJson = fs.readJsonSync(packageJsonPath)
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  // 处理 scoped 包和子路径导入
  // 例如: @vue/runtime-core -> @vue/runtime-core
  //      vue-router/composables -> vue-router
  const basePackage = packageName.startsWith('@')
    ? packageName.split('/').slice(0, 2).join('/')
    : packageName.split('/')[0]

  return basePackage in allDeps
}

/**
 * 扫描目录下的所有源代码文件
 */
function scanSourceFiles(dir: string): string[] {
  const files: string[] = []

  function scan(currentDir: string): void {
    if (!fs.existsSync(currentDir)) {
      return
    }

    let entries
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true })
    }
    catch (error) {
      // 跳过无法读取的目录
      console.warn(`${currentDir}文件无法读取`, error)
      return
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      // 跳过隐藏文件和目录
      if (entry.name.startsWith('.')) {
        continue
      }

      if (entry.isDirectory()) {
        // 跳过特定目录
        const skipDirs = ['node_modules', 'dist', 'coverage', '__test__']
        if (!skipDirs.includes(entry.name)) {
          scan(fullPath)
        }
      }
      else if (entry.name.match(/\.(ts|tsx|js|jsx|vue)$/) && !entry.name.endsWith('.d.ts')) {
        files.push(fullPath)
      }
    }
  }

  scan(dir)
  return files
}

/**
 * 扫描所有模板目录
 */
function scanTemplates(): Array<{ name: string, path: string, packageJsonPath: string }> {
  const templates: Array<{ name: string, path: string, packageJsonPath: string }> = []

  // common/base
  templates.push({
    name: 'common/base',
    path: path.join(TEMPLATES_DIR, 'common/base'),
    packageJsonPath: path.join(TEMPLATES_DIR, 'common/base/package.json'),
  })

  // common/features/*
  const commonFeaturesDir = path.join(TEMPLATES_DIR, 'common/features')
  if (fs.existsSync(commonFeaturesDir)) {
    const features = fs.readdirSync(commonFeaturesDir)
    for (const feature of features) {
      const featurePath = path.join(commonFeaturesDir, feature)
      if (fs.statSync(featurePath).isDirectory()) {
        templates.push({
          name: `common/features/${feature}`,
          path: featurePath,
          packageJsonPath: path.join(featurePath, 'package.json'),
        })
      }
    }
  }

  // vue/base
  templates.push({
    name: 'vue/base',
    path: path.join(TEMPLATES_DIR, 'vue/base'),
    packageJsonPath: path.join(TEMPLATES_DIR, 'vue/base/package.json'),
  })

  // vue/features/*
  const vueFeaturesDir = path.join(TEMPLATES_DIR, 'vue/features')
  if (fs.existsSync(vueFeaturesDir)) {
    const features = fs.readdirSync(vueFeaturesDir)
    for (const feature of features) {
      const featurePath = path.join(vueFeaturesDir, feature)
      if (fs.statSync(featurePath).isDirectory()) {
        templates.push({
          name: `vue/features/${feature}`,
          path: featurePath,
          packageJsonPath: path.join(featurePath, 'package.json'),
        })
      }
    }
  }

  // react/base (如果存在)
  const reactBasePath = path.join(TEMPLATES_DIR, 'react/base')
  if (fs.existsSync(reactBasePath)) {
    templates.push({
      name: 'react/base',
      path: reactBasePath,
      packageJsonPath: path.join(reactBasePath, 'package.json'),
    })
  }

  // react/features/* (如果存在)
  const reactFeaturesDir = path.join(TEMPLATES_DIR, 'react/features')
  if (fs.existsSync(reactFeaturesDir)) {
    const features = fs.readdirSync(reactFeaturesDir)
    for (const feature of features) {
      const featurePath = path.join(reactFeaturesDir, feature)
      if (fs.statSync(featurePath).isDirectory()) {
        templates.push({
          name: `react/features/${feature}`,
          path: featurePath,
          packageJsonPath: path.join(featurePath, 'package.json'),
        })
      }
    }
  }

  return templates
}

describe('模板完整性测试', () => {
  const templates = scanTemplates()

  for (const template of templates) {
    describe(template.name, () => {
      const sourceFiles = scanSourceFiles(template.path)

      it('应该有源代码文件', () => {
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

      it('应该有有效的文件导入（相对路径和别名）', () => {
        const errors: string[] = []

        for (const file of sourceFiles) {
          const content = fs.readFileSync(file, 'utf-8')
          const imports = extractImports(content)

          for (const imp of imports) {
            // 只检查文件导入（相对路径和路径别名）
            if (imp.type === 'relative' || imp.type === 'alias') {
              const resolved = resolveImportPath(file, imp.path, template)

              if (!resolved || !fs.existsSync(resolved)) {
                const relativePath = path.relative(TEMPLATES_DIR, file)
                const resolvedInfo = resolved ? path.relative(TEMPLATES_DIR, resolved) : 'unresolved'
                errors.push(
                  `${relativePath}:${imp.line} - File not found: "${imp.path}" (resolved: ${resolvedInfo})`,
                )
              }
            }
          }
        }

        if (errors.length > 0) {
          throw new Error(`Found ${errors.length} missing file imports:\n${errors.join('\n')}`)
        }
      })

      it('所有包导入都应该在 package.json 中声明', () => {
        const errors: string[] = []
        const missingPackages = new Set<string>()

        for (const file of sourceFiles) {
          const content = fs.readFileSync(file, 'utf-8')
          const imports = extractImports(content)

          for (const imp of imports) {
            if (imp.type === 'package') {
              // 只跳过内置 Node.js 模块
              const builtinModules = ['fs', 'path', 'url', 'crypto', 'http', 'https', 'os', 'util', 'events', 'stream']
              if (imp.path.startsWith('node:') || builtinModules.includes(imp.path)) {
                continue
              }

              if (!checkPackageInDependencies(imp.path, template.packageJsonPath)) {
                missingPackages.add(imp.path)
                const relativePath = path.relative(TEMPLATES_DIR, file)
                errors.push(
                  `${relativePath}:${imp.line} - Package "${imp.path}" not declared in package.json`,
                )
              }
            }
            // 虚拟模块不需要在 package.json 中声明（由插件生成）
            // 但会在文件导入检查中验证其他方面
          }
        }

        if (errors.length > 0) {
          const summary = `Missing packages: ${Array.from(missingPackages).join(', ')}`
          throw new Error(`Found ${errors.length} missing package declarations:\n${summary}\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... and ${errors.length - 10} more` : ''}`)
        }
      })
    })
  }

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
