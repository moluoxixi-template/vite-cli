/**
 * 导入验证工具
 * 用于验证模板文件中的导入语句是否正确
 */

import path from 'node:path'
import fs from 'fs-extra'
import type { TemplateInfo } from './template-validator'

/**
 * 导入类型
 */
export type ImportType = 'package' | 'relative' | 'alias' | 'virtual'

/**
 * 导入信息
 */
export interface ImportInfo {
  type: ImportType
  path: string
  line: number
}

/**
 * 检查 import 路径是否在 tsconfig paths 中配置
 * @param importPath 导入路径
 * @param tsConfigPaths tsconfig paths 配置
 * @returns 是否在 paths 中配置
 */
export function isPathInTsConfig(importPath: string, tsConfigPaths: Record<string, string[]> | null): boolean {
  if (!tsConfigPaths) {
    return false
  }

  // 检查是否匹配任何 path 模式
  for (const [pattern] of Object.entries(tsConfigPaths)) {
    // 将 pattern 转换为正则表达式（支持 * 通配符）
    const regexPattern = pattern.replace(/\*/g, '.*')
    const regex = new RegExp(`^${regexPattern}$`)
    if (regex.test(importPath)) {
      return true
    }
  }

  return false
}

/**
 * 读取模板的 tsconfig 路径配置（支持 extends 和跨模板依赖）
 * @param template 模板信息
 * @param templatesDir 模板根目录
 * @returns tsconfig paths 配置
 */
export function getTsConfigPaths(template: TemplateInfo, templatesDir: string): Record<string, string[]> | null {
  // 根据模板类型确定应该查找的 base 目录
  let basePath: string

  if (template.type === 'common-base') {
    // common/base 使用自己的 tsconfig
    basePath = template.path
  }
  else if (template.type === 'framework-base') {
    // framework base 使用自己的 tsconfig
    basePath = template.path
  }
  else if (template.type === 'framework-feature' || template.type === 'microfrontend-base' || template.type === 'microfrontend-feature') {
    // feature 和微前端相关模板应该查找对应的 framework base 的 tsconfig
    if (!template.framework) {
      return null
    }
    basePath = path.join(templatesDir, template.framework, 'base')
  }
  else {
    // common-feature 使用 common/base 的 tsconfig
    basePath = path.join(templatesDir, 'common/base')
  }

  // 从 base 目录读取 tsconfig
  const tsConfigPath = path.join(basePath, 'tsconfig.app.json')

  if (!fs.existsSync(tsConfigPath)) {
    // 尝试 tsconfig.json
    const fallback = path.join(basePath, 'tsconfig.json')
    if (fs.existsSync(fallback)) {
      return getTsConfigPathsFromFile(fallback)
    }
    return null
  }

  return getTsConfigPathsFromFile(tsConfigPath)
}

/**
 * 从文件读取 tsconfig paths（支持 extends）
 * @param tsConfigPath tsconfig 文件路径
 * @returns tsconfig paths 配置
 */
function getTsConfigPathsFromFile(tsConfigPath: string): Record<string, string[]> | null {
  if (!fs.existsSync(tsConfigPath)) {
    return null
  }

  try {
    const tsConfig = fs.readJsonSync(tsConfigPath)
    let paths = tsConfig.compilerOptions?.paths || null

    // 如果没有 paths，尝试从 extends 读取
    if (!paths && tsConfig.extends) {
      const extendsPath = path.resolve(path.dirname(tsConfigPath), tsConfig.extends)
      const extendedPaths = getTsConfigPathsFromFile(extendsPath)
      if (extendedPaths) {
        paths = extendedPaths
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
 * common/base + framework/base + framework/features/* + micro-frontend/base
 * @param template 模板信息
 * @param templatesDir 模板根目录
 * @returns 依赖路径数组
 */
export function getTemplateDependencyPaths(template: TemplateInfo, templatesDir: string): string[] {
  const searchPaths = [template.path]

  // 如果是 framework base 或 feature，需要包含 common/base
  if (!template.name.startsWith('common/')) {
    searchPaths.push(path.join(templatesDir, 'common/base'))
  }

  // 如果是微前端 base，需要包含对应的 framework base 和可能的 feature
  if (template.name.includes('/micro-frontends/')) {
    const framework = template.name.split('/')[0] // vue 或 react
    searchPaths.push(path.join(templatesDir, framework, 'base'))

    // 微前端 base 可能会使用 pinia feature 中的 stores
    // 检查是否存在 pinia feature
    const piniaFeaturePath = path.join(templatesDir, framework, 'features', 'pinia')
    if (fs.existsSync(piniaFeaturePath)) {
      searchPaths.push(piniaFeaturePath)
    }
  }

  // 如果是 feature，需要包含对应的 framework base
  if (template.name.includes('/features/')) {
    const framework = template.name.split('/')[0] // vue 或 react
    searchPaths.push(path.join(templatesDir, framework, 'base'))
  }

  return searchPaths
}

/**
 * 解析路径别名（如 @/），支持跨模板依赖
 * @param template 模板信息
 * @param aliasPath 别名路径
 * @param templatesDir 模板根目录
 * @returns 解析后的文件路径，如果不存在则返回 null
 */
export function resolveAliasPath(
  template: TemplateInfo,
  aliasPath: string,
  templatesDir: string,
): string | null {
  const paths = getTsConfigPaths(template, templatesDir)

  // 获取所有可能的搜索路径（模拟合并后的结构）
  const searchPaths = getTemplateDependencyPaths(template, templatesDir)

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
 * @param currentFile 当前文件路径
 * @param importPath 导入路径
 * @param template 模板信息
 * @param templatesDir 模板根目录
 * @returns 解析后的文件路径，如果不存在则返回 null
 */
export function resolveImportPath(
  currentFile: string,
  importPath: string,
  template: TemplateInfo,
  templatesDir: string,
): string | null {
  if (importPath.startsWith('@/')) {
    // 解析路径别名（支持跨模板依赖）
    return resolveAliasPath(template, importPath, templatesDir)
  }
  else {
    // 解析相对路径（支持跨模板依赖）
    const currentDir = path.dirname(currentFile)
    const resolved = path.resolve(currentDir, importPath)

    // 文件扩展名列表
    const fileExtensions = [
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
    ]

    const indexExtensions = ['/index.ts', '/index.tsx', '/index.js', '/index.vue']

    // 先尝试在当前文件所在目录查找
    // 1. 直接作为文件（带扩展名）
    for (const ext of fileExtensions) {
      const testPath = resolved + ext
      if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
        return testPath
      }
    }

    // 2. 作为目录，查找 index 文件
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      for (const idxExt of indexExtensions) {
        const indexPath = resolved + idxExt
        if (fs.existsSync(indexPath)) {
          return indexPath
        }
      }
    }

    // 3. 尝试不带扩展名的文件（某些情况下可能）
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      return resolved
    }

    // 如果当前模板中找不到，尝试在依赖模板中查找
    const templateSrcPath = path.join(template.path, 'src')
    if (!currentFile.startsWith(templateSrcPath)) {
      return null
    }

    // 计算相对于 src 的路径
    const relativeFromSrc = path.relative(templateSrcPath, currentFile)
    const currentFileDir = path.dirname(relativeFromSrc)

    // 正确计算导入的相对路径
    let relativeToSrc: string
    if (importPath.startsWith('./')) {
      // 相对路径：./xxx -> 相对于当前文件所在目录
      // 使用 path.resolve 来正确处理相对路径，然后相对于 src 计算
      const resolvedInCurrentTemplate = path.resolve(templateSrcPath, currentFileDir, importPath)
      relativeToSrc = path.relative(templateSrcPath, resolvedInCurrentTemplate)
    }
    else if (importPath.startsWith('../')) {
      // 相对路径：../xxx -> 需要解析相对路径
      const resolvedInCurrentTemplate = path.resolve(templateSrcPath, currentFileDir, importPath)
      relativeToSrc = path.relative(templateSrcPath, resolvedInCurrentTemplate)
    }
    else {
      // 绝对路径（相对于 src）
      relativeToSrc = importPath
    }

    // 规范化路径（统一使用 / 分隔符）
    relativeToSrc = relativeToSrc.replace(/\\/g, '/')

    const searchPaths = getTemplateDependencyPaths(template, templatesDir)
    for (const searchPath of searchPaths) {
      if (searchPath === template.path) {
        continue // 已经检查过了
      }

      const srcPath = path.join(searchPath, 'src')
      if (!fs.existsSync(srcPath)) {
        continue
      }

      // 检查 relativeToSrc 是否已经包含扩展名
      const hasExtension = fileExtensions.some(ext => relativeToSrc.endsWith(ext))

      if (hasExtension) {
        // 如果已经包含扩展名，直接尝试这个路径
        const testPath = path.join(srcPath, relativeToSrc)
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
          return testPath
        }
      }
      else {
        // 尝试所有文件扩展名
        for (const ext of fileExtensions) {
          const testPath = path.join(srcPath, relativeToSrc) + ext
          if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
            return testPath
          }
        }

        // 尝试作为目录查找 index 文件
        const dirPath = path.join(srcPath, relativeToSrc)
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          for (const idxExt of indexExtensions) {
            const indexPath = dirPath + idxExt
            if (fs.existsSync(indexPath)) {
              return indexPath
            }
          }
        }
      }
    }

    return null
  }
}

/**
 * 提取文件中的所有 import 语句
 * 支持以下格式：
 * - import { x } from 'module'
 * - import type { x } from 'module'
 * - import 'module'
 * - import('./module') 动态导入
 * @param content 文件内容
 * @param template 模板信息（用于获取 tsconfig paths）
 * @returns 导入信息数组
 */
export function extractImports(
  content: string,
  template: TemplateInfo,
  templatesDir: string,
): ImportInfo[] {
  const imports: ImportInfo[] = []
  const lines = content.split('\n')
  const tsConfigPaths = getTsConfigPaths(template, templatesDir)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // 匹配 import 和 from 语句中的路径（简单可靠的方式）
    // 匹配 'path' 或 "path" 形式的导入路径
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g
    const matches = line.matchAll(importRegex)

    for (const match of matches) {
      const importPath = match[1]

      let type: ImportType

      // 先检查是否在 tsconfig paths 中配置
      if (isPathInTsConfig(importPath, tsConfigPaths)) {
        type = 'alias'
      }
      // 如果没配置，再判断类型
      else if (importPath.startsWith('virtual:') || importPath.startsWith('~')) {
        // virtual: 开头或 ~ 开头的是虚拟模块（如 ~pages）
        type = 'virtual'
      }
      else if (importPath.startsWith('.')) {
        // . 开头的是相对路径
        type = 'relative'
      }
      else {
        // 其他都是 package（包括 @scope/package 这种 scoped package）
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
 * 检查包导入是否在 package.json 中声明
 * @param packageName 包名称
 * @param packageJsonPath package.json 文件路径
 * @returns 是否在依赖中声明
 */
export function checkPackageInDependencies(packageName: string, packageJsonPath: string): boolean {
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
 * 扫描项目中的所有 import 语句
 * @param dir 项目目录
 * @returns import 路径列表
 */
export async function scanAllImports(dir: string): Promise<string[]> {
  const imports: string[] = []

  async function scan(currentDir: string): Promise<void> {
    if (!fs.existsSync(currentDir)) {
      return
    }

    const entries = await fs.readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        // 跳过 node_modules 和 dist 目录
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          await scan(fullPath)
        }
      }
      else if (entry.name.match(/\.(ts|tsx|js|jsx|vue)$/)) {
        const content = await fs.readFile(fullPath, 'utf-8')

        // 匹配 import 和 from 语句
        const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g
        const matches = content.matchAll(importRegex)
        for (const match of matches) {
          imports.push(match[1])
        }
      }
    }
  }

  await scan(dir)
  return imports
}
