import fs from 'node:fs'
import path from 'node:path'

import yaml from 'yaml'

import { deepMerge } from './deepMerge'
import { sortDependencies } from './sortDependencies'

/**
 * 渲染模板到目标目录
 * 支持物理路径合并和配置文件深度合并
 */
export function renderTemplate(src: string, dest: string): void {
  const stats = fs.statSync(src)

  if (stats.isDirectory()) {
    // 如果是目录，递归处理
    if (path.basename(src) === 'node_modules') {
      return
    }

    fs.mkdirSync(dest, { recursive: true })

    for (const file of fs.readdirSync(src)) {
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

  // 处理 pnpm-workspace.yaml - 深度合并
  if (filename === 'pnpm-workspace.yaml') {
    renderPnpmWorkspace(src, dest)
    return
  }

  // 处理特殊文件名转换（如 _gitignore -> .gitignore）
  const targetFilename = renameFile(filename)
  const targetPath = path.resolve(path.dirname(dest), targetFilename)

  // 普通文件直接复制（后面的会覆盖前面的）
  fs.copyFileSync(src, targetPath)
}

/**
 * 渲染 package.json - 深度合并
 */
function renderPackageJson(src: string, dest: string): void {
  const newPackage = JSON.parse(fs.readFileSync(src, 'utf-8'))

  if (fs.existsSync(dest)) {
    const existingPackage = JSON.parse(fs.readFileSync(dest, 'utf-8'))
    const merged = deepMerge(existingPackage, newPackage)
    // 排序依赖
    if (merged.dependencies) {
      merged.dependencies = sortDependencies(merged.dependencies)
    }
    if (merged.devDependencies) {
      merged.devDependencies = sortDependencies(merged.devDependencies)
    }
    fs.writeFileSync(dest, `${JSON.stringify(merged, null, 2)}\n`)
  }
  else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, `${JSON.stringify(newPackage, null, 2)}\n`)
  }
}

/**
 * 渲染 pnpm-workspace.yaml - 深度合并
 */
function renderPnpmWorkspace(src: string, dest: string): void {
  const newWorkspace = yaml.parse(fs.readFileSync(src, 'utf-8')) || {}

  if (fs.existsSync(dest)) {
    const existingWorkspace = yaml.parse(fs.readFileSync(dest, 'utf-8')) || {}
    const merged = deepMerge(existingWorkspace, newWorkspace)
    // 排序 catalogs 中的依赖
    if (merged.catalogs) {
      for (const key of Object.keys(merged.catalogs)) {
        merged.catalogs[key] = sortDependencies(merged.catalogs[key])
      }
    }
    fs.writeFileSync(dest, yaml.stringify(merged))
  }
  else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, yaml.stringify(newWorkspace))
  }
}

/**
 * 重命名特殊文件
 * 某些文件不能以 . 开头存在于模板中，需要特殊处理
 */
function renameFile(name: string): string {
  // _开头的文件转换为.开头
  if (name.startsWith('_')) {
    return `.${name.slice(1)}`
  }
  return name
}
