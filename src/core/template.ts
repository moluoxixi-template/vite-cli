/**
 * 模板渲染核心模块
 * 处理模板文件的复制和合并逻辑
 */

import fs from 'node:fs'
import path from 'node:path'

import { FILE_CONSTANTS } from '../constants/index.ts'
import { PROJECT_ATOM_FILE } from './projectAtom.ts'
import type { PackageJson } from '../types/packageJson.ts'
import { deepMerge } from '../utils/deepMerge.ts'
import { validatePath } from '../utils/file.ts'
import { sortDependencies } from '../utils/sortDependencies.ts'

/**
 * 渲染模板到目标目录
 * 支持物理路径合并和配置文件深度合并
 * @param src 源路径
 * @param dest 目标路径
 * @throws {Error} 如果路径不安全、文件操作失败
 */
export function renderTemplate(src: string, dest: string): void {
  // 验证路径安全性
  validatePath(src)
  validatePath(dest)

  try {
    const stats = fs.statSync(src)

    // 处理目录
    if (stats.isDirectory()) {
      // 跳过 node_modules 目录
      if (path.basename(src) === FILE_CONSTANTS.NODE_MODULES) {
        return
      }

      // 统一使用绝对路径，确保目录创建和文件复制使用相同的路径格式
      const resolvedDest = path.resolve(dest)
      fs.mkdirSync(resolvedDest, { recursive: true })

      for (const file of fs.readdirSync(src)) {
        // 验证文件名安全性
        if (file.includes('..') || file.includes('~')) {
          throw new Error(`不安全的文件名: ${file}`)
        }
        renderTemplate(path.resolve(src, file), path.resolve(resolvedDest, file))
      }
      return
    }

    // 处理文件
    const filename = path.basename(src)

    // 跳过 .ejs 文件（不再使用）
    if (filename.endsWith(FILE_CONSTANTS.EJS_EXTENSION)) {
      return
    }

    // 跳过项目输出 atom，atom 只供脚手架生成阶段读取
    if (filename === PROJECT_ATOM_FILE) {
      return
    }

    // 处理 package.json - 深度合并
    if (filename === FILE_CONSTANTS.PACKAGE_JSON) {
      renderPackageJson(src, dest)
      return
    }

    // 跳过 pnpm-workspace.yaml（不再使用）
    if (filename === FILE_CONSTANTS.PNPM_WORKSPACE_YAML) {
      return
    }

    // 处理特殊文件名转换（如 _gitignore -> .gitignore）
    const targetFilename = renameFile(filename)
    const targetPath = path.resolve(path.dirname(dest), targetFilename)

    // 确保目标文件的父目录存在
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })

    // 普通文件直接复制（后面的会覆盖前面的）
    fs.copyFileSync(src, targetPath)
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`渲染模板失败: ${src} -> ${dest}\n错误: ${errorMessage}`, {
      cause: error,
    })
  }
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

const PACKAGE_JSON_KEY_ORDER = [
  'name',
  'type',
  'version',
  'private',
  'packageManager',
  'description',
  'author',
  'license',
  'repository',
  'engines',
  'bin',
  'files',
  'scripts',
  'postcss',
  'config',
  'dependencies',
  'devDependencies',
  'lint-staged',
] as const

/**
 * 按生成项目 ESLint 的 package.json 规则稳定顶层字段顺序。
 * @param packageJson 待排序的 package.json
 * @returns 新的有序 package.json
 */
function sortPackageJsonFields(packageJson: PackageJson): PackageJson {
  const keyOrder = new Map<string, number>(
    PACKAGE_JSON_KEY_ORDER.map((key, index) => [key, index]),
  )

  return Object.fromEntries(
    Object.entries(packageJson).sort(([left], [right]) => {
      const leftIndex = keyOrder.get(left) ?? Number.MAX_SAFE_INTEGER
      const rightIndex = keyOrder.get(right) ?? Number.MAX_SAFE_INTEGER
      return leftIndex - rightIndex || left.localeCompare(right)
    }),
  ) as PackageJson
}

/**
 * 渲染 package.json - 深度合并
 * @param src 源文件路径
 * @param dest 目标文件路径
 * @throws {Error} 如果文件读取失败、JSON 解析失败或写入失败
 */
function renderPackageJson(src: string, dest: string): void {
  try {
    const srcContent = fs.readFileSync(src, 'utf-8')
    const newPackage = JSON.parse(srcContent) as PackageJson

    if (fs.existsSync(dest)) {
      const destContent = fs.readFileSync(dest, 'utf-8')
      const existingPackage = JSON.parse(destContent) as PackageJson
      const merged = deepMerge(existingPackage, newPackage)
      sortPackageJsonDependencies(merged)
      fs.writeFileSync(dest, `${JSON.stringify(sortPackageJsonFields(merged), null, 2)}\n`)
    }
    else {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      sortPackageJsonDependencies(newPackage)
      fs.writeFileSync(dest, `${JSON.stringify(sortPackageJsonFields(newPackage), null, 2)}\n`)
    }
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (error instanceof SyntaxError) {
      throw new TypeError(
        `package.json 解析失败: ${src}\n错误: ${errorMessage}`,
        { cause: error },
      )
    }
    throw new Error(
      `处理 package.json 失败: ${src} -> ${dest}\n错误: ${errorMessage}`,
      { cause: error },
    )
  }
}

/**
 * 获取包管理器的默认版本号
 * @param packageManager 包管理器类型
 * @returns 包管理器版本字符串，如果未找到则返回 pnpm 的默认版本
 */
function getPackageManagerVersion(packageManager: string): string {
  const versions: Record<string, string> = {
    pnpm: '10.8.0',
    npm: '10.9.0',
    yarn: '1.22.22',
  }
  return versions[packageManager] || versions.pnpm
}

/**
 * 更新 package.json 的元数据字段（name, description, author, packageManager）
 * @param packageJsonPath package.json 文件路径
 * @param projectName 项目名称
 * @param description 项目描述
 * @param author 作者
 * @param packageManager 包管理器类型
 * @throws {Error} 如果文件读取失败、JSON 解析失败或写入失败
 */
export function updatePackageJsonMetadata(
  packageJsonPath: string,
  projectName: string,
  description: string,
  author: string,
  packageManager: string,
): void {
  if (!fs.existsSync(packageJsonPath)) {
    return
  }

  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content) as PackageJson

    // 更新元数据字段
    packageJson.name = projectName
    if (description) {
      packageJson.description = description
    }
    if (author) {
      packageJson.author = author
    }

    // 更新 packageManager 字段
    packageJson.packageManager = `${packageManager}@${getPackageManagerVersion(packageManager)}`

    // 排序依赖
    sortPackageJsonDependencies(packageJson)

    fs.writeFileSync(
      packageJsonPath,
      `${JSON.stringify(sortPackageJsonFields(packageJson), null, 2)}\n`,
    )
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (error instanceof SyntaxError) {
      throw new TypeError(
        `package.json 解析失败: ${packageJsonPath}\n错误: ${errorMessage}`,
        { cause: error },
      )
    }
    throw new Error(
      `更新 package.json 元数据失败: ${packageJsonPath}\n错误: ${errorMessage}`,
      { cause: error },
    )
  }
}

/**
 * 重命名特殊文件
 * 某些文件不能以 . 开头存在于模板中，需要特殊处理
 * @param name 原始文件名
 * @returns 转换后的文件名，_ 开头的文件会转换为 . 开头
 */
function renameFile(name: string): string {
  // _开头的文件转换为.开头
  if (name.startsWith('_')) {
    return `.${name.slice(1)}`
  }
  return name
}
