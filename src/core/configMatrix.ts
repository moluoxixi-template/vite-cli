/**
 * 合法项目配置矩阵。
 * 组合域来自 capability registry，供质量矩阵和模板展厅共同消费。
 */

import type {
  FrameworkType,
  MicroFrontendEngine,
  PackageManagerType,
  ProjectConfigType,
  RouteModeType,
  UILibraryType,
} from '../types/index.ts'

import {
  FRAMEWORKS,
  getMicroFrontendEngineOptions,
  getRouteModeOptions,
  PACKAGE_MANAGERS,
  UI_LIBRARIES,
} from '../constants/index.ts'

export const CONFIG_MATRIX_BOOLEAN_FEATURES = ['i18n', 'sentry', 'eslint', 'husky'] as const

type BooleanFeature = typeof CONFIG_MATRIX_BOOLEAN_FEATURES[number]

export interface ConfigMatrixOptions {
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

export interface ConfigMatrixEntry {
  name: string
  config: Omit<ProjectConfigType, 'targetDir'> & { targetDir?: string }
}

const DEFAULT_OPTIONS: Required<Pick<ConfigMatrixOptions, 'minimal'>> & {
  defaults: Required<NonNullable<ConfigMatrixOptions['defaults']>>
  combinations: Required<NonNullable<ConfigMatrixOptions['combinations']>>
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

const ROUTE_SLUGS: Record<RouteModeType, string> = {
  manualRoutes: 'manual',
  pageRoutes: 'pages',
}

/**
 * 生成全部合法能力组合。
 * @param options 组合轴覆盖
 * @returns 完整配置矩阵
 */
export function generateConfigMatrix(options: ConfigMatrixOptions = {}): ConfigMatrixEntry[] {
  const resolved = resolveOptions(options)
  const configs: ConfigMatrixEntry[] = []

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
              const featureSuffix = CONFIG_MATRIX_BOOLEAN_FEATURES
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

/**
 * 为矩阵组合生成稳定的公开路径标识。
 * @param config 不含输出目录的项目配置
 * @returns 带 schema 版本的 ASCII slug
 */
export function createConfigMatrixSlug(config: ConfigMatrixEntry['config']): string {
  const runtime = config.microFrontend ? config.microFrontendEngine : 'standard'
  if (!runtime) {
    throw new TypeError('微前端矩阵组合缺少 microFrontendEngine')
  }

  const slug = [
    'v1',
    config.framework,
    config.uiLibrary,
    runtime,
    ROUTE_SLUGS[config.routeMode],
    config.packageManager,
    `i${Number(config.i18n)}`,
    `s${Number(config.sentry)}`,
    `e${Number(config.eslint)}`,
    `h${Number(config.husky)}`,
  ].join('-').toLowerCase()

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new TypeError(`矩阵组合无法生成安全 slug: ${slug}`)
  }
  return slug
}

function resolveOptions(options: ConfigMatrixOptions) {
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
  const axes = CONFIG_MATRIX_BOOLEAN_FEATURES.filter(feature => resolved.combinations[feature])
  const combinations = resolved.minimal && axes.length > 0
    ? [
        Array.from({ length: axes.length }).fill(false) as boolean[],
        Array.from({ length: axes.length }).fill(true) as boolean[],
      ]
    : createBooleanCombinations(axes.length)

  return combinations.map((combination) => {
    const state = Object.fromEntries(
      CONFIG_MATRIX_BOOLEAN_FEATURES.map(feature => [feature, resolved.defaults[feature]]),
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
