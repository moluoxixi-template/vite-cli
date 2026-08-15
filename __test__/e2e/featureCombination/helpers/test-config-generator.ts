/**
 * 测试配置生成器。
 * 组合域来自 capability registry，模板目录只负责结构完整性检查。
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
  getMicroFrontendEngineOptions,
  getRouteModeOptions,
  PACKAGE_MANAGERS,
  UI_LIBRARIES,
} from '@/constants'

const BOOLEAN_FEATURES = ['i18n', 'sentry', 'eslint', 'husky'] as const

type BooleanFeature = typeof BOOLEAN_FEATURES[number]

/**
 * 测试配置选项。
 */
export interface TestConfigOptions {
  /** 只保留全部关闭与全部开启两种布尔状态。 */
  minimal?: boolean
  /** 未参与组合轴时使用的固定值。 */
  defaults?: {
    description?: string
    author?: string
    i18n?: boolean
    sentry?: boolean
    eslint?: boolean
    husky?: boolean
  }
  /** 要参与组合的能力域；布尔值表示该 feature 是否作为组合轴。 */
  combinations?: {
    frameworks?: readonly FrameworkType[]
    uiLibraries?: Partial<Record<FrameworkType, readonly UILibraryType[]>>
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
 * 测试配置项。
 */
export interface TestConfig {
  name: string
  config: Omit<ProjectConfigType, 'targetDir'> & { targetDir?: string }
}

const DEFAULT_OPTIONS: Required<Pick<TestConfigOptions, 'minimal'>> & {
  defaults: Required<NonNullable<TestConfigOptions['defaults']>>
  combinations: Required<NonNullable<TestConfigOptions['combinations']>>
} = {
  minimal: false,
  defaults: {
    description: 'A Vite project',
    author: 'test',
    i18n: false,
    sentry: false,
    eslint: false,
    husky: false,
  },
  combinations: {
    frameworks: FRAMEWORKS,
    uiLibraries: UI_LIBRARIES,
    routeModes: getAllRouteModes(),
    microFrontendEngines: getAllMicroFrontendEngines(),
    packageManagers: PACKAGE_MANAGERS,
    i18n: true,
    sentry: true,
    eslint: true,
    husky: true,
  },
}

/**
 * 生成全部合法能力组合。
 * @param options 组合轴覆盖
 * @returns 完整测试配置
 */
export function generateTestConfigs(options: TestConfigOptions = {}): TestConfig[] {
  const resolved = resolveOptions(options)
  const configs: TestConfig[] = []

  for (const framework of resolved.combinations.frameworks) {
    const uiLibraries = UI_LIBRARIES[framework].filter(uiLibrary =>
      resolved.combinations.uiLibraries[framework]?.includes(uiLibrary),
    )
    const routeModes = getRouteModeOptions(framework)
      .map(option => option.value)
      .filter(routeMode => resolved.combinations.routeModes.includes(routeMode))
    const microFrontendEngines = getMicroFrontendEngineOptions(framework)
      .map(option => option.value)
      .filter(engine => resolved.combinations.microFrontendEngines.includes(engine))
    const microFrontendOptions: Array<MicroFrontendEngine | undefined> = [
      undefined,
      ...microFrontendEngines,
    ]

    for (const uiLibrary of uiLibraries) {
      for (const routeMode of routeModes) {
        for (const microFrontendEngine of microFrontendOptions) {
          for (const packageManager of resolved.combinations.packageManagers) {
            for (const booleanState of createBooleanStates(resolved)) {
              const runtime = microFrontendEngine || 'standard'
              const featureSuffix = BOOLEAN_FEATURES
                .map(feature => `${feature}-${booleanState[feature] ? 'on' : 'off'}`)
                .join('-')
              const name = [
                framework,
                uiLibrary,
                packageManager,
                runtime,
                routeMode,
                featureSuffix,
              ].join('-')

              configs.push({
                name,
                config: {
                  projectName: name,
                  description: resolved.defaults.description,
                  author: resolved.defaults.author,
                  framework,
                  uiLibrary,
                  routeMode,
                  ...booleanState,
                  microFrontend: microFrontendEngine !== undefined,
                  microFrontendEngine,
                  packageManager,
                },
              })
            }
          }
        }
      }
    }
  }

  return configs
}

function resolveOptions(options: TestConfigOptions) {
  return {
    minimal: options.minimal ?? DEFAULT_OPTIONS.minimal,
    defaults: {
      ...DEFAULT_OPTIONS.defaults,
      ...options.defaults,
    },
    combinations: {
      ...DEFAULT_OPTIONS.combinations,
      ...options.combinations,
      uiLibraries: {
        ...DEFAULT_OPTIONS.combinations.uiLibraries,
        ...options.combinations?.uiLibraries,
      },
    },
  }
}

function createBooleanStates(resolved: ReturnType<typeof resolveOptions>): Array<Record<BooleanFeature, boolean>> {
  const axes = BOOLEAN_FEATURES.filter(feature => resolved.combinations[feature])
  const combinations = resolved.minimal && axes.length > 0
    ? [
        Array.from({ length: axes.length }).fill(false) as boolean[],
        Array.from({ length: axes.length }).fill(true) as boolean[],
      ]
    : createBooleanCombinations(axes.length)

  return combinations.map((combination) => {
    const state = Object.fromEntries(
      BOOLEAN_FEATURES.map(feature => [feature, resolved.defaults[feature]]),
    ) as Record<BooleanFeature, boolean>

    axes.forEach((feature, index) => {
      state[feature] = combination[index]
    })
    return state
  })
}

function createBooleanCombinations(size: number): boolean[][] {
  const combinations: boolean[][] = []
  for (let combinationIndex = 0; combinationIndex < 2 ** size; combinationIndex++) {
    const combination: boolean[] = []
    for (let featureIndex = 0; featureIndex < size; featureIndex++) {
      combination.push((combinationIndex & (1 << featureIndex)) !== 0)
    }
    combinations.push(combination)
  }
  return combinations
}

function getAllRouteModes(): RouteModeType[] {
  return Array.from(new Set(FRAMEWORKS.flatMap(framework =>
    getRouteModeOptions(framework).map(option => option.value))))
}

function getAllMicroFrontendEngines(): MicroFrontendEngine[] {
  return Array.from(new Set(FRAMEWORKS.flatMap(framework =>
    getMicroFrontendEngineOptions(framework).map(option => option.value))))
}
