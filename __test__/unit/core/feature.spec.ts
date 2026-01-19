/**
 * feature 核心功能单元测试
 * 基于 feature.ts 导出的所有函数进行测试
 * 确保测试与实现功能统一
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  featureToConfig,
  filterBooleanFeatures,
  getCommonFeatures,
  getFrameworkFeatures,
  getMicroFrontendEngines,
  getRouteModeFeatures,
  renderCommonFeatures,
  renderFrameworkFeatures,
  renderMicroFrontendFeatures,
  scanAllFeatures,
  validateMicroFrontendEngine,
} from '@/core/feature'
import type { ProjectConfigType } from '@/types'
import {
  FRAMEWORKS,
  PACKAGE_MANAGERS,
  ROUTE_MODES,
  UI_LIBRARIES,
} from '@/constants'
import { renderTemplate } from '@/core/template'

// Mock renderTemplate
vi.mock('@/core/template', () => ({
  renderTemplate: vi.fn(),
}))

/**
 * 创建有效的测试配置
 * @param overrides 覆盖的配置项
 * @returns 完整的 ProjectConfigType 对象
 */
function createTestConfig(overrides: Partial<ProjectConfigType> = {}): ProjectConfigType {
  // 使用数组下标获取默认值
  const defaultFramework = FRAMEWORKS[0]
  const defaultUiLibrary = defaultFramework ? UI_LIBRARIES[defaultFramework][0] : undefined
  const defaultRouteMode = ROUTE_MODES[0]
  const defaultPackageManager = PACKAGE_MANAGERS[0]

  return {
    projectName: 'test',
    description: 'test',
    author: 'test',
    framework: defaultFramework!,
    uiLibrary: defaultUiLibrary!,
    routeMode: defaultRouteMode!,
    i18n: false,
    sentry: false,
    eslint: false,
    husky: false,
    microFrontend: false,
    packageManager: defaultPackageManager!,
    targetDir: '/tmp/test',
    ...overrides,
  }
}

// 遍历所有框架，为每个框架执行以下测试
for (const framework of FRAMEWORKS) {
  describe(`框架相关测试 - ${framework}`, () => {
    describe('featureToConfig', () => {
      // 基于 constants 中的 UI_LIBRARIES 遍历测试
      describe('ui 库功能映射', () => {
        const uiLibraries = UI_LIBRARIES[framework]
        if (uiLibraries.length > 0) {
          for (const uiLibrary of uiLibraries) {
            it(`应该映射 ${framework} 框架的 UI 库 "${uiLibrary}"`, () => {
              const result = featureToConfig(uiLibrary, framework)
              expect(result).toEqual({
                key: 'uiLibrary',
                value: uiLibrary,
              })
            })
          }
        }
      })

      // 基于 constants 中的 ROUTE_MODES 遍历测试
      describe('路由模式功能映射', () => {
        for (const routeMode of ROUTE_MODES) {
          it(`应该映射 ${framework} 框架的路由模式 "${routeMode}"`, () => {
            const result = featureToConfig(routeMode, framework)
            expect(result).toEqual({
              key: 'routeMode',
              value: routeMode,
            })
          })
        }
      })

      // 基于文件系统扫描的布尔类型功能测试
      describe('布尔类型功能映射', () => {
        const allFeatures = scanAllFeatures(framework)
        const booleanFeatures = filterBooleanFeatures(allFeatures)

        if (booleanFeatures.length > 0) {
          for (const feature of booleanFeatures) {
            it(`应该映射 ${framework} 框架的布尔类型功能 "${feature}"`, () => {
              const result = featureToConfig(feature, framework)
              expect(result).toEqual({
                key: feature,
                value: true,
              })
            })
          }
        }
      })

      // 测试未知功能（不在任何常量中的功能）
      describe('未知功能映射', () => {
        it(`对于 ${framework} 框架的未知功能应该返回布尔类型`, () => {
          const result = featureToConfig('unknown-feature' as any, framework)
          expect(result).toEqual({
            key: 'unknown-feature',
            value: true,
          })
        })
      })
    })

    describe('scanAllFeatures', () => {
      it(`应该扫描 ${framework} 的所有功能（框架 + 公共 + 微前端）`, () => {
        const features = scanAllFeatures(framework)

        // 应该至少扫描到一些 features
        expect(features.length).toBeGreaterThan(0)
        expect(Array.isArray(features)).toBe(true)

        // 验证去重功能（如果有重复的 features，应该被去重）
        const uniqueFeatures = [...new Set(features)]
        expect(features.length).toBe(uniqueFeatures.length)

        console.log(`\n📁 ${framework} features:`, features)
      })
    })

    describe('getFrameworkFeatures', () => {
      it(`应该返回 ${framework} 框架的功能列表`, () => {
        const features = getFrameworkFeatures(framework)

        expect(Array.isArray(features)).toBe(true)
        expect(features.length).toBeGreaterThan(0)

        console.log(`\n📦 ${framework} framework features:`, features)
      })
    })

    describe('getMicroFrontendEngines', () => {
      it(`应该返回 ${framework} 框架的微前端引擎列表`, () => {
        const engines = getMicroFrontendEngines(framework)

        expect(Array.isArray(engines)).toBe(true)
        console.log(`\n🚀 ${framework} micro-frontend engines:`, engines)
      })
    })

    describe('validateMicroFrontendEngine', () => {
      const engines = getMicroFrontendEngines(framework)

      if (engines.length > 0) {
        it(`应该验证 ${framework} 框架中存在的微前端引擎`, () => {
          for (const engine of engines) {
            const isValid = validateMicroFrontendEngine(framework, engine)
            expect(isValid).toBe(true)
          }
        })

        it(`应该验证 ${framework} 框架中不存在的微前端引擎`, () => {
          const isValid = validateMicroFrontendEngine(framework, 'non-existent-engine')
          expect(isValid).toBe(false)
        })
      }
      else {
        it(`应该处理 ${framework} 框架没有微前端引擎的情况`, () => {
          const isValid = validateMicroFrontendEngine(framework, 'any-engine')
          expect(isValid).toBe(false)
        })
      }
    })

    describe('renderMicroFrontendFeatures', () => {
      beforeEach(() => {
        vi.clearAllMocks()
      })

      const engines = getMicroFrontendEngines(framework)

      if (engines.length > 0) {
        // 遍历所有 UI 库和引擎，生成全量测试
        for (const uiLibrary of UI_LIBRARIES[framework]) {
          for (const engine of engines) {
            it(`应该渲染 ${framework} 框架的微前端功能（UI 库: ${uiLibrary}, 引擎: ${engine}）`, () => {
              const config = createTestConfig({
                framework,
                uiLibrary,
                i18n: true,
              })
              const targetDir = '/tmp/test'

              renderMicroFrontendFeatures(config, targetDir, engine)

              // 如果微前端 features 目录存在且有匹配的功能，应该调用 renderTemplate
              // 如果不存在或没有匹配的功能，函数会直接返回，不会调用 renderTemplate
              // 这里验证函数不会抛出错误，且根据实际文件系统情况可能调用 renderTemplate
              expect(() => {
                renderMicroFrontendFeatures(config, targetDir, engine)
              }).not.toThrow()
            })

            it(`应该渲染 ${framework} 框架微前端的 UI 库功能（UI 库: ${uiLibrary}, 引擎: ${engine}）`, () => {
              const config = createTestConfig({
                framework,
                uiLibrary,
              })
              const targetDir = '/tmp/test'

              renderMicroFrontendFeatures(config, targetDir, engine)

              // 验证函数不会抛出错误
              // 如果微前端有 UI 库覆盖，应该会调用 renderTemplate
              expect(() => {
                renderMicroFrontendFeatures(config, targetDir, engine)
              }).not.toThrow()
            })

            it(`不应该渲染 ${framework} 框架微前端中配置为 false 的功能（UI 库: ${uiLibrary}, 引擎: ${engine}）`, () => {
              const config = createTestConfig({
                framework,
                uiLibrary,
                i18n: false,
                sentry: false,
              })
              const targetDir = '/tmp/test'

              renderMicroFrontendFeatures(config, targetDir, engine)

              // 验证函数不会抛出错误
              // 由于 i18n 和 sentry 设置为 false，且微前端函数只处理值为 true 的配置
              // 所以这些功能不应该被渲染（如果微前端目录存在且有这些功能的话）
              expect(() => {
                renderMicroFrontendFeatures(config, targetDir, engine)
              }).not.toThrow()
            })

            it(`不应该渲染 ${framework} 框架微前端中配置为 true 但不存在于微前端 features 的功能（UI 库: ${uiLibrary}, 引擎: ${engine}）`, () => {
              const config = {
                ...createTestConfig({
                  framework,
                  uiLibrary,
                }),
                // 设置一个不存在的微前端 feature 为 true
                nonExistentMicroFeature: true,
              } as ProjectConfigType & { nonExistentMicroFeature: boolean }
              const targetDir = '/tmp/test'

              renderMicroFrontendFeatures(config, targetDir, engine)

              // 验证 renderTemplate 的调用参数中不包含不存在的微前端功能路径
              const calls = vi.mocked(renderTemplate).mock.calls
              const nonExistentPath = calls.find(call =>
                call[0]?.includes('nonExistentMicroFeature')
                && call[0]?.includes('micro-frontends'),
              )

              // 不存在的微前端 feature 不应该被渲染
              expect(nonExistentPath).toBeUndefined()
            })
          }

          it(`当 UI 库不存在于 ${framework} 框架微前端 features 时，不应该渲染 UI 库（UI 库: ${uiLibrary}）`, () => {
            // 遍历所有引擎测试
            for (const engine of engines) {
              // 创建一个配置，使用一个不存在的 UI 库
              const config = createTestConfig({
                framework,
                uiLibrary: 'non-existent-ui-library' as any,
              })
              const targetDir = '/tmp/test'

              renderMicroFrontendFeatures(config, targetDir, engine)

              // 验证 renderTemplate 的调用参数中不包含不存在的 UI 库路径（微前端）
              const calls = vi.mocked(renderTemplate).mock.calls
              const uiLibraryPath = calls.find(call =>
                call[0]?.includes('non-existent-ui-library')
                && call[0]?.includes('micro-frontends'),
              )

              // 不存在的 UI 库不应该被渲染
              expect(uiLibraryPath).toBeUndefined()
            }
          })
        }
      }
      else {
        // 遍历所有 UI 库测试没有微前端引擎的情况
        for (const uiLibrary of UI_LIBRARIES[framework]) {
          it(`应该处理 ${framework} 框架没有微前端引擎的情况（UI 库: ${uiLibrary}）`, () => {
            const config = createTestConfig({
              framework,
              uiLibrary,
            })
            const targetDir = '/tmp/test'

            // 应该直接返回，不抛出错误
            expect(() => {
              renderMicroFrontendFeatures(config, targetDir, 'non-existent-engine')
            }).not.toThrow()
          })
        }
      }
    })

    // 🔍 基于文件系统的自动化测试（使用 feature.ts 的函数）
    describe('基于文件系统的自动化测试（使用 feature.ts 函数）', () => {
      describe('功能映射覆盖', () => {
        const allFeatures = scanAllFeatures(framework)
        const frameworkFeatures = getFrameworkFeatures(framework)

        it(`应该从 templates/${framework}/ 扫描到功能`, () => {
          expect(allFeatures.length).toBeGreaterThan(0)
        })

        it(`应该获取到框架功能`, () => {
          expect(frameworkFeatures.length).toBeGreaterThan(0)
        })

        for (const feature of allFeatures) {
          it(`应该正确映射功能 "${feature}"`, () => {
            const result = featureToConfig(feature, framework)

            // 应该总是返回有效的配置对象
            expect(result).toHaveProperty('key')
            expect(result).toHaveProperty('value')
            expect(result).not.toBeNull()

            // key 应该是有效的配置键
            // UI 库和路由模式有特殊 key，其他都是布尔类型（key === feature 名）
            const specialKeys = ['uiLibrary', 'routeMode']
            if (specialKeys.includes(result.key)) {
              // UI 库或路由模式
              expect(result.value).toBe(feature)
            }
            else {
              // 布尔类型：key === feature 名，value === true
              expect(result.key).toBe(feature)
              expect(result.value).toBe(true)
            }
          })
        }
      })

      describe('功能覆盖验证', () => {
        it('应该有 UI 库功能', () => {
          const features = scanAllFeatures(framework)
          const uiLibraries = features.filter((f) => {
            const config = featureToConfig(f, framework)
            return config?.key === 'uiLibrary'
          })

          // 每个框架至少应该有一个 UI 库
          expect(uiLibraries.length).toBeGreaterThan(0)
          console.log(`\n📦 ${framework} UI libraries:`, uiLibraries)
        })

        it('应该有路由模式功能', () => {
          const features = scanAllFeatures(framework)
          const routeModes = features.filter((f) => {
            const config = featureToConfig(f, framework)
            return config?.key === 'routeMode'
          })

          // 每个框架至少应该有一个路由模式
          expect(routeModes.length).toBeGreaterThan(0)
          console.log(`\n🚦 ${framework} route modes:`, routeModes)
        })
      })
    })

    describe('renderFrameworkFeatures', () => {
      beforeEach(() => {
        vi.clearAllMocks()
      })

      it('应该渲染配置中为 true 且存在于文件系统的框架功能', () => {
        const availableFeatures = getFrameworkFeatures(framework)
        const booleanFeatures = filterBooleanFeatures(availableFeatures)

        for (const testFeature of booleanFeatures) {
          const config = createTestConfig({
            framework,
            [testFeature]: true,
          })
          const targetDir = '/tmp/test'

          vi.clearAllMocks()
          renderFrameworkFeatures(config, targetDir)

          // 验证 renderTemplate 被调用，且调用了该功能的路径
          expect(renderTemplate).toHaveBeenCalled()
          const calls = vi.mocked(renderTemplate).mock.calls
          const featurePath = calls.find(call => call[0]?.includes(testFeature) && call[0]?.includes(framework))
          expect(featurePath).toBeDefined()
        }
      })

      it('应该渲染 UI 库功能（如果 UI 库存在于文件系统）', () => {
        const availableFeatures = getFrameworkFeatures(framework)
        const uiLibraries = UI_LIBRARIES[framework]

        for (const uiLibrary of uiLibraries) {
          if (availableFeatures.includes(uiLibrary)) {
            const config = createTestConfig({
              framework,
              uiLibrary,
            })
            const targetDir = '/tmp/test'

            vi.clearAllMocks()
            renderFrameworkFeatures(config, targetDir)

            // 验证 renderTemplate 被调用，且调用了 UI 库的路径
            expect(renderTemplate).toHaveBeenCalled()
            const calls = vi.mocked(renderTemplate).mock.calls
            const uiLibraryPath = calls.find(call =>
              call[0]?.includes(uiLibrary) && call[0]?.includes(framework),
            )
            expect(uiLibraryPath).toBeDefined()
          }
        }
      })

      it('不应该渲染配置中为 false 的功能', () => {
        const availableFeatures = getFrameworkFeatures(framework)
        const booleanFeatures = filterBooleanFeatures(availableFeatures)

        for (const testFeature of booleanFeatures) {
          const config = createTestConfig({
            framework,
            [testFeature]: false,
          })
          const targetDir = '/tmp/test'

          vi.clearAllMocks()
          renderFrameworkFeatures(config, targetDir)

          // 验证 renderTemplate 的调用参数中不包含 false 的功能路径
          const calls = vi.mocked(renderTemplate).mock.calls
          const featurePath = calls.find(call => call[0]?.includes(testFeature) && call[0]?.includes(framework))

          // 设置为 false 的功能不应该被渲染
          expect(featurePath).toBeUndefined()
        }
      })

      it('不应该渲染配置中为 true 但不存在于文件系统的功能', () => {
        const config = {
          ...createTestConfig({
            framework,
          }),
          // 设置一个不存在的 feature 为 true
          nonExistentFeature: true,
        } as ProjectConfigType & { nonExistentFeature: boolean }
        const targetDir = '/tmp/test'

        renderFrameworkFeatures(config, targetDir)

        // 验证 renderTemplate 的调用参数中不包含不存在的功能路径
        const calls = vi.mocked(renderTemplate).mock.calls
        const nonExistentPath = calls.find(call =>
          call[0]?.includes('nonExistentFeature') && call[0]?.includes(framework),
        )

        // 不存在的 feature 不应该被渲染
        expect(nonExistentPath).toBeUndefined()
      })

      it('当 UI 库不存在于文件系统时，不应该渲染 UI 库', () => {
        // 创建一个配置，使用一个不存在的 UI 库
        const config = createTestConfig({
          framework,
          uiLibrary: 'non-existent-ui-library' as any,
        })
        const targetDir = '/tmp/test'

        renderFrameworkFeatures(config, targetDir)

        // 验证 renderTemplate 的调用参数中不包含不存在的 UI 库路径
        const calls = vi.mocked(renderTemplate).mock.calls
        const uiLibraryPath = calls.find(call =>
          call[0]?.includes('non-existent-ui-library') && call[0]?.includes(framework),
        )

        // 不存在的 UI 库不应该被渲染
        expect(uiLibraryPath).toBeUndefined()
      })
    })
  })
}

describe('getRouteModeFeatures', () => {
  // 基于 constants 中的 ROUTE_MODES 遍历测试
  for (const routeMode of ROUTE_MODES) {
    it(`应该为 "${routeMode}" 返回正确的功能`, () => {
      const result = getRouteModeFeatures(routeMode)

      // 遍历所有路由模式，验证每个路由模式的布尔值
      for (const mode of ROUTE_MODES) {
        expect(result).toHaveProperty(mode)
        expect(typeof result[mode]).toBe('boolean')
        // 当前路由模式应该为 true，其他应该为 false
        expect(result[mode]).toBe(mode === routeMode)
      }
    })
  }

  it('应该处理无效的路由模式', () => {
    const result = getRouteModeFeatures('default' as any)

    // 遍历所有路由模式，验证都为 false
    for (const mode of ROUTE_MODES) {
      expect(result[mode]).toBe(false)
    }
  })
})

describe('getCommonFeatures', () => {
  it('应该返回公共功能列表', () => {
    const features = getCommonFeatures()

    expect(Array.isArray(features)).toBe(true)
    console.log('\n📦 Common features:', features)
  })
})

describe('filterBooleanFeatures', () => {
  // 遍历所有框架，使用 scanAllFeatures 的返回值进行测试
  for (const framework of FRAMEWORKS) {
    it(`应该过滤出 ${framework} 框架的布尔类型功能（排除 UI 库和路由模式）`, () => {
      // 使用 scanAllFeatures 获取所有 features（包括框架、公共、微前端）
      const allFeatures = scanAllFeatures(framework)
      const booleanFeatures = filterBooleanFeatures(allFeatures)

      // 获取所有 UI 库和路由模式
      const allUiLibraries = Object.values(UI_LIBRARIES).flat()

      // 验证过滤后的结果不包含 UI 库
      for (const uiLibrary of allUiLibraries) {
        expect(booleanFeatures).not.toContain(uiLibrary)
      }

      // 验证过滤后的结果不包含路由模式
      for (const routeMode of ROUTE_MODES) {
        expect(booleanFeatures).not.toContain(routeMode)
      }

      // 验证过滤后的结果只包含布尔类型功能（存在于原始 features 中）
      for (const booleanFeature of booleanFeatures) {
        expect(allFeatures).toContain(booleanFeature)
        expect(allUiLibraries).not.toContain(booleanFeature)
        expect(ROUTE_MODES).not.toContain(booleanFeature)
      }
    })
  }

  it('应该处理空数组', () => {
    const booleanFeatures = filterBooleanFeatures([])
    expect(booleanFeatures).toEqual([])
  })

  it('应该处理只包含 UI 库和路由模式的数组', () => {
    const allFeatures = ['element-plus', 'manualRoutes']
    const booleanFeatures = filterBooleanFeatures(allFeatures)
    expect(booleanFeatures).toEqual([])
  })
})

describe('renderCommonFeatures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该渲染配置中为 true 的公共功能', () => {
    const config = createTestConfig({
      eslint: true,
      husky: true,
      i18n: false,
    })
    const targetDir = '/tmp/test'

    renderCommonFeatures(config, targetDir)

    // 验证 renderTemplate 被调用（具体调用次数取决于实际存在的 features）
    expect(renderTemplate).toHaveBeenCalled()
  })

  it('不应该渲染配置中为 false 的公共功能', () => {
    const config = createTestConfig({
      eslint: false,
      husky: false,
    })
    const targetDir = '/tmp/test'

    renderCommonFeatures(config, targetDir)

    // 验证 renderTemplate 的调用参数中不包含 false 的功能路径
    const calls = vi.mocked(renderTemplate).mock.calls
    const eslintPath = calls.find(call => call[0]?.includes('eslint'))
    const huskyPath = calls.find(call => call[0]?.includes('husky'))

    // eslint 和 husky 设置为 false，不应该被渲染
    expect(eslintPath).toBeUndefined()
    expect(huskyPath).toBeUndefined()
  })

  it('不应该渲染配置中为 true 但不存在于文件系统的公共功能', () => {
    const config = {
      ...createTestConfig(),
      // 设置一个不存在的公共 feature 为 true
      nonExistentCommonFeature: true,
    } as ProjectConfigType & { nonExistentCommonFeature: boolean }
    const targetDir = '/tmp/test'

    renderCommonFeatures(config, targetDir)

    // 验证 renderTemplate 的调用参数中不包含不存在的功能路径
    const calls = vi.mocked(renderTemplate).mock.calls
    const nonExistentPath = calls.find(call => call[0]?.includes('nonExistentCommonFeature'))

    // 不存在的公共 feature 不应该被渲染
    expect(nonExistentPath).toBeUndefined()
  })
})
