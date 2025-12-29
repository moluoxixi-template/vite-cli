import fs from 'node:fs'
import path from 'node:path'

import { validatePath } from './file.ts'
import { deepMerge } from './deepMerge.ts'
import { sortDependencies } from './sortDependencies.ts'

/**
 * package.json 类型定义
 */
interface PackageJson {
  name?: string
  version?: string
  description?: string
  author?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  [key: string]: unknown
}

/**
 * 渲染模板到目标目录
 * 支持物理路径合并和配置文件深度合并
 * @param src 源路径
 * @param dest 目标路径
 * @throws {Error} 如果路径不安全
 */
export function renderTemplate(src: string, dest: string): void {
  // 验证路径安全性
  validatePath(src)
  validatePath(dest)

  const stats = fs.statSync(src)

  if (stats.isDirectory()) {
    // 如果是目录，递归处理
    if (path.basename(src) === 'node_modules') {
      return
    }

    fs.mkdirSync(dest, { recursive: true })

    for (const file of fs.readdirSync(src)) {
      // 验证文件名安全性
      if (file.includes('..') || file.includes('~')) {
        throw new Error(`不安全的文件名: ${file}`)
      }
      renderTemplate(path.resolve(src, file), path.resolve(dest, file))
    }
    return
  }

  const filename = path.basename(src)

  // 跳过 .ejs 文件（由生成器单独处理）
  if (filename.endsWith('.ejs')) {
    return
  }

  // 跳过 vite.config.data.ts 文件（用于数据驱动合并）
  if (filename === 'vite.config.data.ts') {
    return
  }

  // 处理 package.json - 深度合并
  if (filename === 'package.json') {
    renderPackageJson(src, dest)
    return
  }

  // 跳过 pnpm-workspace.yaml（不再使用）
  if (filename === 'pnpm-workspace.yaml') {
    return
  }

  // 处理特殊文件名转换（如 _gitignore -> .gitignore）
  const targetFilename = renameFile(filename)
  const targetPath = path.resolve(path.dirname(dest), targetFilename)

  // 普通文件直接复制（后面的会覆盖前面的）
  fs.copyFileSync(src, targetPath)
}

/**
 * 对 package.json 的依赖进行排序
 * @param packageJson package.json 对象（会被修改）
 */
function sortPackageJsonDependencies(packageJson: PackageJson): void {
  if (packageJson.dependencies) {
    packageJson.dependencies = sortDependencies(packageJson.dependencies)
  }
  if (packageJson.devDependencies) {
    packageJson.devDependencies = sortDependencies(packageJson.devDependencies)
  }
}

/**
 * 渲染 package.json - 深度合并
 * @param src 源文件路径
 * @param dest 目标文件路径
 * @throws {Error} 如果文件读取失败、JSON 解析失败或写入失败
 */
function renderPackageJson(src: string, dest: string): void {
  const newPackage = JSON.parse(fs.readFileSync(src, 'utf-8')) as PackageJson

  if (fs.existsSync(dest)) {
    const existingPackage = JSON.parse(fs.readFileSync(dest, 'utf-8')) as PackageJson
    const merged = deepMerge(existingPackage, newPackage)
    sortPackageJsonDependencies(merged)
    fs.writeFileSync(dest, `${JSON.stringify(merged, null, 2)}\n`)
  }
  else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, `${JSON.stringify(newPackage, null, 2)}\n`)
  }
}

/**
 * 更新 package.json 的元数据字段（name, description, author）
 * @param packageJsonPath package.json 文件路径
 * @param projectName 项目名称
 * @param description 项目描述
 * @param author 作者
 * @throws {Error} 如果文件读取失败、JSON 解析失败或写入失败
 */
export function updatePackageJsonMetadata(
  packageJsonPath: string,
  projectName: string,
  description: string,
  author: string,
): void {
  if (!fs.existsSync(packageJsonPath)) {
    return
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson

  // 更新元数据字段
  packageJson.name = projectName
  if (description) {
    packageJson.description = description
  }
  if (author) {
    packageJson.author = author
  }

  // 排序依赖
  sortPackageJsonDependencies(packageJson)

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
}

/**
 * 重命名特殊文件
 * 某些文件不能以 . 开头存在于模板中，需要特殊处理
 * @param name 原始文件名
 * @returns 转换后的文件名
 */
function renameFile(name: string): string {
  // _开头的文件转换为.开头
  if (name.startsWith('_')) {
    return `.${name.slice(1)}`
  }
  return name
}
