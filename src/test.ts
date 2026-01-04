/**
 * 测试脚本
 * 通过文件系统扫描自动生成所有测试用例组合
 *
 * 用法:
 *   pnpm test              # 生成所有测试用例
 *   pnpm test --minimal    # 只生成全量和最小配置
 */

import type {
  FrameworkType,
  MicroFrontendEngine,
  PackageManagerType,
  ProjectConfigType,
  RouteModeType,
  UILibraryType,
} from './types/index.ts'

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import chalk from 'chalk'
import fs from 'fs-extra'

import { FILE_CONSTANTS } from './constants/index.ts'

import { generateProject } from './generators/index.ts'
import { featureToConfig, scanAllFeatures } from './utils/featureMapping.ts'
import { getRouteModeFeatures } from './utils/routeModeMapping.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** 测试输出目录 */
const TEST_OUTPUT_DIR = path.resolve(__dirname, '../test')

/**
 * 测试配置
 * 集中管理测试选项，方便随时调整
 */
const TEST_CONFIG = {
  /** 固定默认值（不参与组合测试） */
  defaults: {
    /** 项目名称（会自动生成，此处为描述） */
    projectName: 'auto-generated',
    /** 项目描述 */
    description: 'A Vite project',
    /** 作者 */
    author: 'test',
    /** 是否启用国际化 */
    i18n: true,
    /** 是否启用错误监控 */
    sentry: false,
    /** 是否启用 ESLint */
    eslint: true,
    /** 是否启用 Git Hooks */
    husky: true,
  },
  /** 参与组合测试的选项 */
  combinations: {
    /** 框架列表（空数组表示不启用） */
    frameworks: ['vue', 'react'] as FrameworkType[],
    /** UI 库配置（按框架分组，空数组表示不启用，需要明确配置才启用） */
    uiLibraries: {
      vue: ['element-plus', 'ant-design-vue'] as string[], // Vue 可用的 UI 库
      react: ['ant-design'] as string[], // React 可用的 UI 库
    },
    /** 路由模式列表（空数组表示不启用） */
    routeModes: ['manualRoutes', 'pageRoutes'] as string[],
    /** 微前端引擎列表（空数组表示不启用） */
    microFrontendEngines: ['qiankun'] as MicroFrontendEngine[],
    /** 包管理器列表（空数组表示不启用） */
    packageManagers: ['pnpm'] as PackageManagerType[],
    /** 是否测试 i18n 的组合 */
    i18n: false,
    /** 是否测试 sentry 的组合 */
    sentry: false,
    /** 是否测试 eslint 的组合 */
    eslint: false,
    /** 是否测试 husky 的组合 */
    husky: false,
  },
} as const

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
 */
function generateTestConfigs(): Array<{ name: string, config: Partial<ProjectConfigType> }> {
  const configs: Array<{ name: string, config: Partial<ProjectConfigType> }> = []
  // 框架列表（空数组表示不启用）
  const frameworks = TEST_CONFIG.combinations.frameworks.length > 0
    ? TEST_CONFIG.combinations.frameworks
    : []

  if (frameworks.length === 0) {
    return configs
  }

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

    // 过滤掉不需要测试的布尔特性（根据 combinations 配置决定）
    // 过滤掉根据框架自动选择的特性（pinia/zustand）
    const autoSelectedFeatures = framework === 'vue' ? ['pinia'] : ['zustand']
    const filteredBooleanFeatures = booleanFeatures.filter((feature) => {
      // 排除自动选择的特性
      if (autoSelectedFeatures.includes(feature)) {
        return false
      }
      // 根据 combinations 配置决定是否参与组合测试
      const featureConfig = featureToConfig(feature, framework)
      if (featureConfig && featureConfig.key in TEST_CONFIG.combinations) {
        const combinationValue = TEST_CONFIG.combinations[featureConfig.key as keyof typeof TEST_CONFIG.combinations]
        // 如果是数组（frameworks, uiLibraries, routeModes, packageManagers），跳过
        if (Array.isArray(combinationValue)) {
          return true
        }
        // 其他布尔特性根据配置决定（i18n, sentry, eslint, husky）
        // 使用 Boolean() 转换，避免类型检查问题
        return Boolean(combinationValue)
      }
      // 默认参与组合测试
      return true
    })

    // 生成所有组合
    // UI 库列表（按框架分组配置，空数组表示不启用）
    const frameworkUiLibraries = TEST_CONFIG.combinations.uiLibraries[framework] || []

    // 如果配置为空数组，表示不启用该框架的 UI 库测试
    if (frameworkUiLibraries.length === 0) {
      continue
    }

    // 只测试配置中指定的 UI 库
    const uiLibrariesToTest = uiLibraries.filter(uiLib => frameworkUiLibraries.includes(uiLib))

    if (uiLibrariesToTest.length === 0) {
      continue
    }

    for (const uiLibrary of uiLibrariesToTest) {
      // 路由模式列表（空数组表示不启用，使用默认值）
      const routeModesToTest = TEST_CONFIG.combinations.routeModes.length > 0
        ? routeModes.filter(routeMode => TEST_CONFIG.combinations.routeModes.includes(routeMode))
        : (routeModes.length > 0 ? routeModes : ['manualRoutes']) // 默认

      if (routeModesToTest.length === 0) {
        continue
      }

      for (const routeModeFeature of routeModesToTest) {
        // 微前端引擎列表（空数组表示不启用）
        const microFrontendEnginesToTest = TEST_CONFIG.combinations.microFrontendEngines

        // 如果配置了微前端引擎，生成两种组合：不带微前端（null）和带微前端（配置的引擎）
        // 如果没配置，只生成不带微前端的组合
        const microFrontendOptions: (MicroFrontendEngine | null)[] = microFrontendEnginesToTest.length > 0
          ? [null, ...microFrontendEnginesToTest] // 总是包含 null（不带），再加上配置的引擎
          : [null] // 如果没配置，只生成不带微前端的

        for (const microFrontendEngine of microFrontendOptions) {
          // 生成所有布尔 features 的组合（2^n 种）
          const combinations = generateAllCombinations(filteredBooleanFeatures)

          // 包管理器列表（空数组表示不启用）
          const packageManagersToTest = TEST_CONFIG.combinations.packageManagers

          if (packageManagersToTest.length === 0) {
            continue
          }

          for (const packageManager of packageManagersToTest) {
            for (const combination of combinations) {
              const config: Partial<ProjectConfigType> = {
                framework,
                uiLibrary: uiLibrary as UILibraryType,
                routeMode: featureToConfig(routeModeFeature, framework)!.value as RouteModeType,
                packageManager,
                microFrontend: microFrontendEngine !== null,
                microFrontendEngine: microFrontendEngine || undefined,
              }

              // 根据 routeMode 设置对应的布尔 feature
              const routeModeFeatures = getRouteModeFeatures(routeModeFeature as RouteModeType)
              config.manualRoutes = routeModeFeatures.manualRoutes
              config.pageRoutes = routeModeFeatures.pageRoutes

              // 应用布尔 features 的组合
              for (let i = 0; i < filteredBooleanFeatures.length; i++) {
                const feature = filteredBooleanFeatures[i]
                const enabled = combination[i]
                const featureConfig = featureToConfig(feature, framework)
                if (featureConfig && featureConfig.key !== 'uiLibrary' && featureConfig.key !== 'routeMode') {
                  config[featureConfig.key as keyof ProjectConfigType] = enabled as never
                }
              }

              // 生成测试用例名称
              // 如果没有布尔特性组合，使用固定后缀
              const suffix = filteredBooleanFeatures.length === 0
                ? 'default'
                : (() => {
                    const enabledFeatures = filteredBooleanFeatures.filter((_, i) => combination[i])
                    return enabledFeatures.length === 0
                      ? 'minimal'
                      : enabledFeatures.length === filteredBooleanFeatures.length
                        ? 'full'
                        : enabledFeatures.join('-')
                  })()

              // 生成测试用例名称
              const packageManagerSuffix = TEST_CONFIG.combinations.packageManagers.length > 1 ? `${packageManager}-` : ''
              const microFrontendSuffix = microFrontendEngine ? `${microFrontendEngine}-` : ''
              configs.push(createTestConfig(framework, uiLibrary, `${packageManagerSuffix}${microFrontendSuffix}${routeModeFeature}-${suffix}`, config))
            }
          }
        }
      }
    }
  }

  return configs
}

/**
 * 创建测试配置的辅助函数
 * @param framework 框架类型
 * @param uiLibrary UI 库名称
 * @param suffix 后缀名称
 * @param overrides 配置覆盖项
 * @returns 测试配置对象
 */
function createTestConfig(
  framework: FrameworkType,
  uiLibrary: string,
  suffix: string,
  overrides: Partial<ProjectConfigType>,
): { name: string, config: Partial<ProjectConfigType> } {
  const name = `${framework}-${uiLibrary}-${suffix}`
  return {
    name,
    config: {
      // 固定默认值，不参与组合测试
      projectName: name,
      description: TEST_CONFIG.defaults.description,
      author: TEST_CONFIG.defaults.author,
      // 固定默认值，不参与组合测试（避免几何级增长）
      i18n: TEST_CONFIG.defaults.i18n,
      sentry: TEST_CONFIG.defaults.sentry,
      eslint: TEST_CONFIG.defaults.eslint,
      husky: TEST_CONFIG.defaults.husky,
      packageManager: TEST_CONFIG.combinations.packageManagers[0] as PackageManagerType,
      ...overrides,
    },
  }
}

/**
 * 生成测试项目
 * @returns Promise<void>
 */
async function generateTestProjects(): Promise<void> {
  console.log(chalk.blue.bold('\n🧪 开始生成测试项目...\n'))

  // 扫描并生成测试配置
  const TEST_CONFIGS = generateTestConfigs()
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
      // 固定默认值（不参与组合测试）
      projectName: config.projectName || name,
      description: config.description || TEST_CONFIG.defaults.description,
      author: config.author || TEST_CONFIG.defaults.author,
      framework: config.framework!,
      uiLibrary: config.uiLibrary!,
      routeMode: config.routeMode!,
      // feature 名称与目录名称一致
      pinia: config.framework === 'vue',
      zustand: config.framework === 'react',
      ...getRouteModeFeatures(config.routeMode!),
      // 固定默认值（不参与组合测试，避免几何级增长）
      i18n: config.i18n ?? TEST_CONFIG.defaults.i18n,
      sentry: config.sentry ?? TEST_CONFIG.defaults.sentry,
      eslint: config.eslint ?? TEST_CONFIG.defaults.eslint,
      husky: config.husky ?? TEST_CONFIG.defaults.husky,
      // 参与组合测试的特性
      microFrontend: config.microFrontend ?? false,
      microFrontendEngine: config.microFrontendEngine,
      packageManager: config.packageManager ?? TEST_CONFIG.combinations.packageManagers[0],
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
 * 检查 package.json 中是否有 catalog 引用（应该已经全部替换为实际版本号）
 * @param projectDir 项目目录路径
 * @returns 检查是否通过（true 表示通过，false 表示失败）
 */
function checkPackageJsonVersions(projectDir: string): boolean {
  const packageJsonPath = path.join(projectDir, FILE_CONSTANTS.PACKAGE_JSON)
  if (!fs.existsSync(packageJsonPath)) {
    console.log(chalk.red(`  ❌ package.json 不存在`))
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  let hasError = false

  // 检查 dependencies 中是否还有 catalog 引用
  if (packageJson.dependencies) {
    for (const [dep, version] of Object.entries(packageJson.dependencies)) {
      if (typeof version === 'string' && version.startsWith('catalog:')) {
        console.log(chalk.red(`  ❌ dependencies.${dep}: "${version}" 应该使用实际版本号`))
        hasError = true
      }
    }
  }

  // 检查 devDependencies 中是否还有 catalog 引用
  if (packageJson.devDependencies) {
    for (const [dep, version] of Object.entries(packageJson.devDependencies)) {
      if (typeof version === 'string' && version.startsWith('catalog:')) {
        console.log(chalk.red(`  ❌ devDependencies.${dep}: "${version}" 应该使用实际版本号`))
        hasError = true
      }
    }
  }

  if (!hasError) {
    console.log(chalk.green(`  ✅ package.json 版本号检查通过（无 catalog 引用）`))
  }

  return !hasError
}

/**
 * 审计 @moluoxixi 依赖
 */
async function auditMoluoxixiDeps(): Promise<void> {
  console.log(chalk.blue.bold('\n🔍 开始审计 @moluoxixi 依赖...\n'))

  const TEST_CONFIGS = generateTestConfigs()
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
    const packageJsonPath = path.join(projectDir, FILE_CONSTANTS.PACKAGE_JSON)

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

    if (!config.husky) {
      const huskyDir = path.join(projectDir, '.husky')
      if (fs.existsSync(huskyDir)) {
        console.log(chalk.red(`  ❌ 不应存在 .husky/ 目录（Git Hooks 已禁用）`))
        hasError = true
      }
      else {
        console.log(chalk.green(`  ✅ .husky/ 目录已正确移除`))
      }
    }

    // 检查 package.json 版本号（确保没有 catalog 引用）
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
 * @param dir 目录路径
 * @param indent 缩进字符串
 * @returns Promise<void>
 */
async function printFileTree(dir: string, indent: string): Promise<void> {
  const items = fs.readdirSync(dir).sort()

  for (const item of items) {
    if (item === FILE_CONSTANTS.NODE_MODULES)
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
 * 执行测试项目生成、依赖审计和文件树显示
 * @returns Promise<void>
 */
async function main(): Promise<void> {
  console.log(chalk.blue.bold(`\n${'='.repeat(60)}`))
  console.log(chalk.blue.bold('  Vite CLI Next - 产物审计测试'))
  console.log(chalk.blue.bold('='.repeat(60)))

  // 1. 生成测试项目
  await generateTestProjects()

  // 2. 审计 @moluoxixi 依赖
  await auditMoluoxixiDeps()

  // 3. 显示文件树
  await showFileTrees()

  console.log(chalk.green.bold('\n✅ 全量产物审计完成!\n'))
}

main().catch(console.error)
