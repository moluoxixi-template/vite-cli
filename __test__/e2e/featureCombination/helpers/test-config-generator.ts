/**
 * 测试配置生成器
 * 基于文件系统自动扫描并生成所有测试组合
 * 当添加新的 template feature 时，测试会自动覆盖
 */

import type {
  FrameworkType,
  MicroFrontendEngine,
  PackageManagerType,
  ProjectConfigType,
  RouteModeType,
  UILibraryType,
} from '@/types'
import {
  FRAMEWORKS,
  MICRO_FRONTEND_ENGINES,
  PACKAGE_MANAGERS,
  ROUTE_MODES,
  UI_LIBRARIES,
} from '@/constants'
import { getAutoSelectedStateManagement } from '@/utils/framework'
import { featureToConfig, getRouteModeFeatures, scanAllFeatures } from '@/core/feature'

/**
 * 测试配置选项
 */
export interface TestConfigOptions {
  /** 是否使用 minimal 模式（只生成全量和最小配置） */
  minimal?: boolean
  /** 固定默认值（不参与组合测试） */
  defaults?: {
    description?: string
    author?: string
    i18n?: boolean
    sentry?: boolean
    eslint?: boolean
    husky?: boolean
  }
  /** 参与组合测试的选项 */
  combinations?: {
    frameworks?: readonly FrameworkType[]
    uiLibraries?: {
      vue?: readonly UILibraryType[]
      react?: readonly UILibraryType[]
    }
    routeModes?: readonly RouteModeType[]
    microFrontendEngines?: readonly MicroFrontendEngine[]
    packageManagers?: readonly PackageManagerType[]
    i18n?: boolean
    sentry?: boolean
    eslint?: boolean
    husky?: boolean
  }
}

/**
 * 测试配置项
 */
export interface TestConfig {
  name: string
  config: Partial<ProjectConfigType>
  shouldHaveFiles?: string[]
  shouldNotHaveFiles?: string[]
  requiredDeps?: string[]
  requiredDevDeps?: string[]
  shouldNotHaveDeps?: string[]
}

/**
 * 默认测试配置
 */
const DEFAULT_OPTIONS: TestConfigOptions = {
  minimal: false,
  defaults: {
    description: 'A Vite project',
    author: 'test',
    i18n: true,
    sentry: false,
    eslint: true,
    husky: true,
  },
  combinations: {
    frameworks: FRAMEWORKS,
    uiLibraries: UI_LIBRARIES,
    routeModes: ROUTE_MODES,
    microFrontendEngines: MICRO_FRONTEND_ENGINES,
    packageManagers: PACKAGE_MANAGERS,
    i18n: false,
    sentry: false,
    eslint: false,
    husky: false,
  },
}

/**
 * 生成所有可能的布尔组合（2^n）
 * @param items 要组合的项目数组
 * @returns 所有可能的布尔组合
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
 * 基于文件系统自动生成测试配置（扫描 templates/ 目录）
 * @param options 测试配置选项
 * @returns 测试配置数组
 */
export function generateTestConfigs(options: TestConfigOptions = {}): TestConfig[] {
  const configs: TestConfig[] = []
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    defaults: { ...DEFAULT_OPTIONS.defaults, ...options.defaults },
    combinations: { ...DEFAULT_OPTIONS.combinations, ...options.combinations },
  }

  const frameworks = opts.combinations!.frameworks || []

  if (frameworks.length === 0) {
    return configs
  }

  for (const framework of frameworks) {
    // 🔍 自动扫描 templates/{framework}/ 下的所有 feature
    const allFeatures = scanAllFeatures(framework)

    // 分类 features
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

    // 过滤布尔特性（排除自动选择的状态管理库）
    const autoSelectedStateManagement = getAutoSelectedStateManagement(framework)
    const autoSelectedFeatures = [autoSelectedStateManagement]
    const filteredBooleanFeatures = booleanFeatures.filter((feature) => {
      if (autoSelectedFeatures.includes(feature)) {
        return false
      }
      const featureConfig = featureToConfig(feature, framework)
      if (featureConfig && featureConfig.key in opts.combinations!) {
        const combinationValue = opts.combinations![featureConfig.key as keyof typeof opts.combinations]
        if (Array.isArray(combinationValue)) {
          return true
        }
        return Boolean(combinationValue)
      }
      return true
    })

    // 获取要测试的 UI 库（从配置 + 文件系统扫描交集）
    const frameworkUiLibraries = opts.combinations!.uiLibraries?.[framework] || []
    if (frameworkUiLibraries.length === 0) {
      continue
    }

    const uiLibrariesToTest = uiLibraries.filter(uiLib =>
      frameworkUiLibraries.includes(uiLib as UILibraryType),
    )

    if (uiLibrariesToTest.length === 0) {
      continue
    }

    for (const uiLibrary of uiLibrariesToTest) {
      // 获取要测试的路由模式
      const routeModesToTest = opts.combinations!.routeModes!.length > 0
        ? routeModes.filter(routeMode => opts.combinations!.routeModes!.includes(routeMode as RouteModeType))
        : (routeModes.length > 0 ? routeModes : ['manualRoutes'])

      if (routeModesToTest.length === 0) {
        continue
      }

      for (const routeModeFeature of routeModesToTest) {
        const microFrontendEnginesToTest = opts.combinations!.microFrontendEngines || []

        const microFrontendOptions: (MicroFrontendEngine | null)[] = microFrontendEnginesToTest.length > 0
          ? [null, ...microFrontendEnginesToTest]
          : [null]

        for (const microFrontendEngine of microFrontendOptions) {
          const combinations = generateAllCombinations(filteredBooleanFeatures)

          const packageManagersToTest = opts.combinations!.packageManagers!

          if (packageManagersToTest.length === 0) {
            continue
          }

          for (const packageManager of packageManagersToTest) {
            // minimal 模式：只生成全开和全关
            const combinationsToTest = opts.minimal && filteredBooleanFeatures.length > 0
              ? [
                  Array.from({ length: filteredBooleanFeatures.length }).fill(false) as boolean[],
                  Array.from({ length: filteredBooleanFeatures.length }).fill(true) as boolean[],
                ]
              : combinations

            for (const combination of combinationsToTest) {
              const config: Partial<ProjectConfigType> = {
                framework,
                uiLibrary: uiLibrary as UILibraryType,
                routeMode: featureToConfig(routeModeFeature, framework)!.value as RouteModeType,
                packageManager,
                microFrontend: microFrontendEngine !== null,
                microFrontendEngine: microFrontendEngine || undefined,
              }

              // 设置路由模式对应的特性
              const routeModeFeatures = getRouteModeFeatures(routeModeFeature as RouteModeType)
              config.manualRoutes = routeModeFeatures.manualRoutes
              config.pageRoutes = routeModeFeatures.pageRoutes

              // 应用布尔特性组合
              for (let i = 0; i < filteredBooleanFeatures.length; i++) {
                const feature = filteredBooleanFeatures[i]
                const enabled = combination[i]
                const featureConfig = featureToConfig(feature, framework)
                if (featureConfig && featureConfig.key !== 'uiLibrary' && featureConfig.key !== 'routeMode') {
                  config[featureConfig.key as keyof ProjectConfigType] = enabled as never
                }
              }

              // 生成名称
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

              const packageManagerSuffix = packageManagersToTest.length > 1 ? `${packageManager}-` : ''
              const microFrontendSuffix = microFrontendEngine ? `${microFrontendEngine}-` : ''
              const name = `${framework}-${uiLibrary}-${packageManagerSuffix}${microFrontendSuffix}${routeModeFeature}-${suffix}`

              configs.push(createTestConfig(name, config, opts.defaults!))
            }
          }
        }
      }
    }
  }

  return configs
}

/**
 * 创建测试配置
 * @param name 测试名称
 * @param config 项目配置
 * @param defaults 默认值
 * @returns 测试配置对象
 */
function createTestConfig(
  name: string,
  config: Partial<ProjectConfigType>,
  defaults: NonNullable<TestConfigOptions['defaults']>,
): TestConfig {
  return {
    name,
    config: {
      projectName: name,
      description: defaults.description,
      author: defaults.author,
      i18n: defaults.i18n,
      sentry: defaults.sentry,
      eslint: defaults.eslint,
      husky: defaults.husky,
      ...config,
    },
    // 这些可以在测试中动态计算
    shouldHaveFiles: undefined,
    shouldNotHaveFiles: undefined,
    requiredDeps: undefined,
    requiredDevDeps: undefined,
    shouldNotHaveDeps: undefined,
  }
}
