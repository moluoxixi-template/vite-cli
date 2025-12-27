/**
 * 测试脚本
 * 通过文件系统扫描自动生成所有测试用例组合
 *
 * 用法:
 *   pnpm test              # 生成所有测试用例
 *   pnpm test --minimal    # 只生成全量和最小配置
 */

import type { ProjectConfigType } from './types'

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import chalk from 'chalk'
import fs from 'fs-extra'

import { generateProject } from './generators/project'
import { featureToConfig, scanAllFeatures } from './utils/featureMapping'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** 测试输出目录 */
const TEST_OUTPUT_DIR = path.resolve(__dirname, '../test')

/**
 * 解析命令行参数
 */
function parseArgs(): { minimalOnly: boolean } {
  const args = process.argv.slice(2)
  const minimalOnly = args.includes('--minimal') || args.includes('--min') || args.includes('-m')
  return { minimalOnly }
}

/**
 * 生成所有可能的组合（包括全开、全关）
 */
function generateAllCombinations<T>(items: T[]): boolean[][] {
  const n = items.length
  const combinations: boolean[][] = []

  // 生成 2^n 种组合
  for (let i = 0; i < 2 ** n; i++) {
    const combination: boolean[] = []
    for (let j = 0; j < n; j++) {
      combination.push((i & (1 << j)) !== 0)
    }
    combinations.push(combination)
  }

  return combinations
}

/**
 * 自动生成测试用例配置（基于组合算法）
 * @param minimalOnly 是否只生成全量和最小配置
 */
function generateTestConfigs(minimalOnly = false): Array<{ name: string, config: Partial<ProjectConfigType> }> {
  const configs: Array<{ name: string, config: Partial<ProjectConfigType> }> = []
  const frameworks: Array<'vue' | 'react'> = ['vue', 'react']

  for (const framework of frameworks) {
    const allFeatures = scanAllFeatures(framework)

    // 分离不同类型的 features
    const uiLibraries: string[] = []
    const routeModes: string[] = []
    const booleanFeatures: string[] = []

    for (const feature of allFeatures) {
      const config = featureToConfig(feature, framework)
      if (!config)
        continue

      if (config.key === 'uiLibrary') {
        uiLibraries.push(feature)
      }
      else if (config.key === 'routeMode') {
        routeModes.push(feature)
      }
      else {
        booleanFeatures.push(feature)
      }
    }

    if (uiLibraries.length === 0)
      continue

    if (minimalOnly) {
      // 只生成全量和最小配置：每个框架只选择一个 UI 库和一个路由模式
      const uiLibrary = uiLibraries[0] // 只选择第一个 UI 库
      const routeModeFeature = routeModes.length > 0 ? routeModes[0] : 'manualRoutes' // 只选择第一个路由模式

      // 只生成全量和最小两种配置
      const allFalse = Array.from({ length: booleanFeatures.length }, () => false)
      const allTrue = Array.from({ length: booleanFeatures.length }, () => true)
      const combinations = [allFalse, allTrue]

      for (const combination of combinations) {
        const config: any = {
          framework,
          uiLibrary: uiLibrary as any,
          routeMode: featureToConfig(routeModeFeature, framework)!.value,
          packageManager: 'pnpm',
        }

        // 应用布尔 features 的组合
        for (let i = 0; i < booleanFeatures.length; i++) {
          const feature = booleanFeatures[i]
          const enabled = combination[i]
          const featureConfig = featureToConfig(feature, framework)
          if (featureConfig && featureConfig.key !== 'uiLibrary' && featureConfig.key !== 'routeMode') {
            config[featureConfig.key] = enabled
          }
        }

        // 生成测试用例名称
        const suffix = combination.every(v => !v) ? 'minimal' : 'full'
        configs.push(createTestConfig(framework, uiLibrary, suffix, config))
      }
    }
    else {
      // 生成所有组合
      for (const uiLibrary of uiLibraries) {
        // 为每个路由模式生成测试用例
        const routeModesToTest = routeModes.length > 0 ? routeModes : ['manualRoutes'] // 默认

        for (const routeModeFeature of routeModesToTest) {
          // 生成所有布尔 features 的组合（2^n 种）
          const combinations = generateAllCombinations(booleanFeatures)

          for (const combination of combinations) {
            const config: any = {
              framework,
              uiLibrary: uiLibrary as any,
              routeMode: featureToConfig(routeModeFeature, framework)!.value,
              packageManager: 'pnpm',
            }

            // 应用布尔 features 的组合
            for (let i = 0; i < booleanFeatures.length; i++) {
              const feature = booleanFeatures[i]
              const enabled = combination[i]
              const featureConfig = featureToConfig(feature, framework)
              if (featureConfig && featureConfig.key !== 'uiLibrary' && featureConfig.key !== 'routeMode') {
                config[featureConfig.key] = enabled
              }
            }

            // 生成测试用例名称
            const enabledFeatures = booleanFeatures.filter((_, i) => combination[i])
            const suffix = enabledFeatures.length === 0
              ? 'minimal'
              : enabledFeatures.length === booleanFeatures.length
                ? 'full'
                : enabledFeatures.join('-')

            configs.push(createTestConfig(framework, uiLibrary, `${routeModeFeature}-${suffix}`, config))
          }
        }
      }
    }
  }

  return configs
}

/**
 * 创建测试配置的辅助函数
 */
function createTestConfig(framework: 'vue' | 'react', uiLibrary: string, suffix: string, overrides: any) {
  const name = `${framework}-${uiLibrary}-${suffix}`
  return {
    name,
    config: {
      projectName: name,
      description: `${framework === 'vue' ? 'Vue' : 'React'} + ${uiLibrary} ${suffix}`,
      author: 'test',
      ...overrides,
    },
  }
}

/**
 * 生成测试项目
 * @param minimalOnly 是否只生成全量和最小配置
 */
async function generateTestProjects(minimalOnly = false): Promise<void> {
  const mode = minimalOnly ? '（仅全量和最小配置）' : '（全部组合）'
  console.log(chalk.blue.bold(`\n🧪 开始生成测试项目${mode}...\n`))

  // 扫描并生成测试配置
  const TEST_CONFIGS = generateTestConfigs(minimalOnly)
  console.log(chalk.cyan(`📋 扫描到 ${TEST_CONFIGS.length} 个测试用例\n`))

  // 清理并创建测试目录
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.removeSync(TEST_OUTPUT_DIR)
  }
  fs.ensureDirSync(TEST_OUTPUT_DIR)

  // 创建 Vue 和 React 子目录
  const vueOutputDir = path.join(TEST_OUTPUT_DIR, 'vue')
  const reactOutputDir = path.join(TEST_OUTPUT_DIR, 'react')
  fs.ensureDirSync(vueOutputDir)
  fs.ensureDirSync(reactOutputDir)

  for (const { name, config } of TEST_CONFIGS) {
    console.log(chalk.cyan(`📦 生成 ${name}...`))

    // 根据框架决定输出目录
    const frameworkOutputDir = config.framework === 'vue' ? vueOutputDir : reactOutputDir

    const fullConfig: ProjectConfigType = {
      projectName: config.projectName!,
      description: config.description!,
      author: config.author!,
      framework: config.framework!,
      uiLibrary: config.uiLibrary!,
      routeMode: config.routeMode!,
      router: config.router ?? true,
      stateManagement: config.stateManagement ?? true,
      i18n: config.i18n!,
      qiankun: config.qiankun!,
      sentry: config.sentry!,
      eslint: config.eslint!,
      gitHooks: config.gitHooks!,
      packageManager: config.packageManager!,
      targetDir: path.join(frameworkOutputDir, name),
    }

    try {
      await generateProject(fullConfig)
      console.log(chalk.green(`  ✅ ${name} 生成成功`))
    }
    catch (error) {
      console.log(chalk.red(`  ❌ ${name} 生成失败:`), error)
    }
  }

  console.log(chalk.green.bold('\n✅ 测试项目生成完成!\n'))
}

/**
 * 检查 package.json 中是否有直接版本号
 */
function checkPackageJsonVersions(projectDir: string): boolean {
  const packageJsonPath = path.join(projectDir, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    console.log(chalk.red(`  ❌ package.json 不存在`))
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  let hasError = false

  // 检查 dependencies
  if (packageJson.dependencies) {
    for (const [dep, version] of Object.entries(packageJson.dependencies)) {
      if (typeof version === 'string' && /^[\^~]?\d/.test(version)) {
        console.log(chalk.red(`  ❌ dependencies.${dep}: "${version}" 应该使用 catalog:build`))
        hasError = true
      }
    }
  }

  // 检查 devDependencies
  if (packageJson.devDependencies) {
    for (const [dep, version] of Object.entries(packageJson.devDependencies)) {
      if (typeof version === 'string' && /^[\^~]?\d/.test(version)) {
        console.log(chalk.red(`  ❌ devDependencies.${dep}: "${version}" 应该使用 catalog:dev 或 catalog:type`))
        hasError = true
      }
      // 检查 latest
      if (version === 'latest' && !dep.includes('@moluoxixi')) {
        console.log(chalk.yellow(`  ⚠️  devDependencies.${dep}: "latest" 应该使用 catalog:dev`))
        hasError = true
      }
    }
  }

  if (!hasError) {
    console.log(chalk.green(`  ✅ package.json 版本号检查通过`))
  }

  return !hasError
}

/**
 * 审计 @moluoxixi 依赖
 * @param minimalOnly 是否只生成全量和最小配置
 */
async function auditMoluoxixiDeps(minimalOnly = false): Promise<void> {
  console.log(chalk.blue.bold('\n🔍 开始审计 @moluoxixi 依赖...\n'))

  const TEST_CONFIGS = generateTestConfigs(minimalOnly)
  const requiredDeps = [
    '@moluoxixi/vite-config',
    '@moluoxixi/ajax-package',
  ]

  let hasError = false

  for (const { name, config } of TEST_CONFIGS) {
    // 根据框架决定输出目录
    const frameworkOutputDir = config.framework === 'vue'
      ? path.join(TEST_OUTPUT_DIR, 'vue')
      : path.join(TEST_OUTPUT_DIR, 'react')
    const projectDir = path.join(frameworkOutputDir, name)
    const packageJsonPath = path.join(projectDir, 'package.json')
    const workspacePath = path.join(projectDir, 'pnpm-workspace.yaml')

    console.log(chalk.cyan(`📋 检查 ${name}...`))

    // 根据配置决定需要检查的依赖
    const depsToCheck = [...requiredDeps]
    if (config.eslint) {
      depsToCheck.push('@moluoxixi/eslint-config')
    }

    // 检查 package.json
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJsonSync(packageJsonPath)
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      }

      for (const dep of depsToCheck) {
        if (!allDeps[dep]) {
          console.log(chalk.red(`  ❌ package.json 缺少 ${dep}`))
          hasError = true
        }
        else {
          console.log(chalk.green(`  ✅ package.json 包含 ${dep}`))
        }
      }
    }
    else {
      console.log(chalk.red(`  ❌ package.json 不存在`))
      hasError = true
    }

    // 检查 pnpm-workspace.yaml
    if (fs.existsSync(workspacePath)) {
      const workspaceContent = fs.readFileSync(workspacePath, 'utf-8')

      for (const dep of depsToCheck) {
        if (!workspaceContent.includes(dep)) {
          console.log(chalk.red(`  ❌ pnpm-workspace.yaml 缺少 ${dep}`))
          hasError = true
        }
        else {
          console.log(chalk.green(`  ✅ pnpm-workspace.yaml 包含 ${dep}`))
        }
      }
    }
    else {
      console.log(chalk.red(`  ❌ pnpm-workspace.yaml 不存在`))
      hasError = true
    }

    // 检查可选特性文件
    if (!config.eslint) {
      const eslintConfig = path.join(projectDir, 'eslint.config.ts')
      if (fs.existsSync(eslintConfig)) {
        console.log(chalk.red(`  ❌ 不应存在 eslint.config.ts（ESLint 已禁用）`))
        hasError = true
      }
      else {
        console.log(chalk.green(`  ✅ eslint.config.ts 已正确移除`))
      }
    }

    if (!config.gitHooks) {
      const huskyDir = path.join(projectDir, '.husky')
      if (fs.existsSync(huskyDir)) {
        console.log(chalk.red(`  ❌ 不应存在 .husky/ 目录（Git Hooks 已禁用）`))
        hasError = true
      }
      else {
        console.log(chalk.green(`  ✅ .husky/ 目录已正确移除`))
      }
    }

    // 检查 package.json 版本号
    console.log(chalk.cyan(`  🔍 检查 package.json 版本号...`))
    const packageJsonOk = checkPackageJsonVersions(projectDir)
    if (!packageJsonOk) {
      hasError = true
    }

    console.log('')
  }

  if (hasError) {
    console.log(chalk.red.bold('\n❌ 审计失败: 存在问题\n'))
    process.exit(1)
  }
  else {
    console.log(chalk.green.bold('\n✅ 审计通过: 所有检查项均通过\n'))
  }
}

/**
 * 显示文件树
 */
async function showFileTrees(): Promise<void> {
  console.log(chalk.blue.bold('\n📂 项目文件树...\n'))

  const vueOutputDir = path.join(TEST_OUTPUT_DIR, 'vue')
  const reactOutputDir = path.join(TEST_OUTPUT_DIR, 'react')

  // 显示 Vue 项目
  if (fs.existsSync(vueOutputDir)) {
    console.log(chalk.cyan.bold('\n📁 Vue 项目:\n'))
    const vueProjects = fs.readdirSync(vueOutputDir).filter((item) => {
      const itemPath = path.join(vueOutputDir, item)
      return fs.statSync(itemPath).isDirectory()
    })
    for (const projectName of vueProjects) {
      const projectDir = path.join(vueOutputDir, projectName)
      console.log(chalk.cyan(`\n${projectName}/`))
      await printFileTree(projectDir, '  ')
    }
  }

  // 显示 React 项目
  if (fs.existsSync(reactOutputDir)) {
    console.log(chalk.cyan.bold('\n📁 React 项目:\n'))
    const reactProjects = fs.readdirSync(reactOutputDir).filter((item) => {
      const itemPath = path.join(reactOutputDir, item)
      return fs.statSync(itemPath).isDirectory()
    })
    for (const projectName of reactProjects) {
      const projectDir = path.join(reactOutputDir, projectName)
      console.log(chalk.cyan(`\n${projectName}/`))
      await printFileTree(projectDir, '  ')
    }
  }
}

/**
 * 打印文件树
 */
async function printFileTree(dir: string, indent: string): Promise<void> {
  const items = fs.readdirSync(dir).sort()

  for (const item of items) {
    if (item === 'node_modules')
      continue

    const itemPath = path.join(dir, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      console.log(chalk.gray(`${indent}📁 ${item}/`))
      await printFileTree(itemPath, `${indent}  `)
    }
    else {
      console.log(chalk.gray(`${indent}📄 ${item}`))
    }
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const { minimalOnly } = parseArgs()

  console.log(chalk.blue.bold(`\n${'='.repeat(60)}`))
  console.log(chalk.blue.bold('  Vite CLI Next - 产物审计测试'))
  if (minimalOnly) {
    console.log(chalk.yellow.bold('  模式: 仅全量和最小配置'))
  }
  console.log(chalk.blue.bold('='.repeat(60)))

  // 1. 生成测试项目
  await generateTestProjects(minimalOnly)

  // 2. 审计 @moluoxixi 依赖
  await auditMoluoxixiDeps(minimalOnly)

  // 3. 显示文件树
  await showFileTrees()

  console.log(chalk.green.bold('\n✅ 全量产物审计完成!\n'))
}

main().catch(console.error)
