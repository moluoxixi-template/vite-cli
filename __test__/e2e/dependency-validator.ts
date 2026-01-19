/**
 * 依赖验证工具
 * 用于验证生成的项目依赖是否完整、版本是否正确
 */

import path from 'node:path'
import fs from 'fs-extra'
import { execa } from 'execa'

/**
 * 依赖验证选项
 */
export interface DependencyValidationOptions {
  /** 必需的 dependencies */
  required?: string[]
  /** 必需的 devDependencies */
  devRequired?: string[]
  /** 版本约束（简单的前缀匹配） */
  versionConstraints?: Record<string, string>
  /** 是否检查 peerDependencies */
  checkPeerDeps?: boolean
  /** 不应该存在的依赖（用于验证条件性依赖） */
  shouldNotHave?: string[]
}

/**
 * 依赖验证结果
 */
export interface DependencyValidationResult {
  /** 是否通过验证 */
  valid: boolean
  /** 缺失的依赖 */
  missingDeps: string[]
  /** 版本不匹配的依赖 */
  versionMismatches: Array<{
    package: string
    expected: string
    actual: string
  }>
  /** peer 依赖问题 */
  peerDepIssues: string[]
  /** 不应该存在但存在的依赖 */
  unexpectedDeps: string[]
}

/**
 * 验证项目依赖
 * @param projectDir 项目目录
 * @param options 验证选项
 * @returns 验证结果
 */
export async function validateDependencies(
  projectDir: string,
  options: DependencyValidationOptions,
): Promise<DependencyValidationResult> {
  const packageJsonPath = path.join(projectDir, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return {
      valid: false,
      missingDeps: ['package.json not found'],
      versionMismatches: [],
      peerDepIssues: [],
      unexpectedDeps: [],
    }
  }

  const packageJson = await fs.readJson(packageJsonPath)

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  const result: DependencyValidationResult = {
    valid: true,
    missingDeps: [],
    versionMismatches: [],
    peerDepIssues: [],
    unexpectedDeps: [],
  }

  // 检查必需的 dependencies
  if (options.required) {
    for (const dep of options.required) {
      if (!packageJson.dependencies?.[dep]) {
        result.missingDeps.push(dep)
        result.valid = false
      }
    }
  }

  // 检查必需的 devDependencies
  if (options.devRequired) {
    for (const dep of options.devRequired) {
      if (!packageJson.devDependencies?.[dep]) {
        result.missingDeps.push(`${dep} (dev)`)
        result.valid = false
      }
    }
  }

  // 检查版本约束（简单的前缀匹配）
  if (options.versionConstraints) {
    for (const [pkg, expectedVersion] of Object.entries(options.versionConstraints)) {
      const actualVersion = allDeps[pkg]
      if (actualVersion && !satisfiesVersionSimple(actualVersion, expectedVersion)) {
        result.versionMismatches.push({
          package: pkg,
          expected: expectedVersion,
          actual: actualVersion,
        })
        result.valid = false
      }
    }
  }

  // 检查不应该存在的依赖
  if (options.shouldNotHave) {
    for (const dep of options.shouldNotHave) {
      if (allDeps[dep]) {
        result.unexpectedDeps.push(dep)
        result.valid = false
      }
    }
  }

  // 检查 peerDependencies（可选）
  if (options.checkPeerDeps) {
    try {
      const { exitCode } = await execa('pnpm', ['list', '--json'], {
        cwd: projectDir,
        reject: false,
      })

      if (exitCode !== 0) {
        result.peerDepIssues.push('pnpm list command failed')
        result.valid = false
      }
    }
    catch (error) {
      result.peerDepIssues.push(`Failed to check peer dependencies: ${String(error)}`)
      // peer deps 检查失败不影响总体验证（因为可能依赖未安装）
    }
  }

  return result
}

/**
 * 简单的版本匹配（支持前缀匹配）
 * @param actual 实际版本
 * @param expected 期望版本
 * @returns 是否匹配
 */
function satisfiesVersionSimple(actual: string, expected: string): boolean {
  // 移除前导符号（^, ~, >=, 等）
  const cleanActual = actual.replace(/^[\^~>=<]+/, '')
  const cleanExpected = expected.replace(/^[\^~>=<]+/, '')

  // 简单的前缀匹配
  return cleanActual.startsWith(cleanExpected.split('.')[0])
}

/**
 * 查找 package.json 中的 catalog 引用
 * @param packageJson package.json 对象
 * @returns catalog 引用列表
 */
export function findCatalogReferences(packageJson: any): string[] {
  const refs: string[] = []

  function checkDeps(deps: Record<string, string> | undefined, type: string): void {
    if (!deps)
      return
    for (const [name, version] of Object.entries(deps)) {
      if (version.startsWith('catalog:')) {
        refs.push(`${type}.${name}: ${version}`)
      }
    }
  }

  checkDeps(packageJson.dependencies, 'dependencies')
  checkDeps(packageJson.devDependencies, 'devDependencies')

  return refs
}

/**
 * 检查文件是否存在
 * @param filePath 文件路径
 * @returns 是否存在
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

/**
 * 读取 package.json
 * @param projectDir 项目目录
 * @returns package.json 对象
 */
export async function readPackageJson(projectDir: string): Promise<any> {
  const packageJsonPath = path.join(projectDir, 'package.json')
  return await fs.readJson(packageJsonPath)
}
