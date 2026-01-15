/**
 * feature 核心功能单元测试
 * 基于文件系统自动扫描 templates/ 目录中的所有 features
 * 当添加新的 feature 时，测试会自动覆盖
 */

import { describe, expect, it } from 'vitest'
import { featureToConfig, getRouteModeFeatures, scanAllFeatures } from '@/core/feature.ts'
import type { FrameworkType } from '@/types/index.ts'
import { FRAMEWORKS } from '@/constants/index.ts'

describe('featureToConfig', () => {
  it('should map UI library features for Vue', () => {
    const result = featureToConfig('element-plus', 'vue')
    expect(result).toEqual({
      key: 'uiLibrary',
      value: 'element-plus',
    })
  })

  it('should return null for unavailable UI library features', () => {
    // React 的 ant-design 目前被注释掉了，应该返回 null
    const result = featureToConfig('ant-design', 'react')
    expect(result).toBeNull()
  })

  it('should map route mode features', () => {
    const manualRoutes = featureToConfig('manualRoutes', 'vue')
    expect(manualRoutes).toEqual({
      key: 'routeMode',
      value: 'manualRoutes',
    })

    const pageRoutes = featureToConfig('pageRoutes', 'vue')
    expect(pageRoutes).toEqual({
      key: 'routeMode',
      value: 'pageRoutes',
    })
  })

  it('should map boolean features', () => {
    const i18n = featureToConfig('i18n', 'vue')
    expect(i18n).toEqual({
      key: 'i18n',
      value: true,
    })

    const sentry = featureToConfig('sentry', 'react')
    expect(sentry).toEqual({
      key: 'sentry',
      value: true,
    })
  })

  it('should map state management features', () => {
    const pinia = featureToConfig('pinia', 'vue')
    expect(pinia).toEqual({
      key: 'pinia',
      value: true,
    })

    const zustand = featureToConfig('zustand', 'react')
    expect(zustand).toEqual({
      key: 'zustand',
      value: true,
    })
  })

  it('should return null for unknown features', () => {
    const result = featureToConfig('unknown-feature' as any, 'vue')
    expect(result).toBeNull()
  })

  it('should handle different frameworks', () => {
    const frameworks: FrameworkType[] = ['vue', 'react']
    for (const framework of frameworks) {
      const result = featureToConfig('i18n', framework)
      expect(result).toEqual({
        key: 'i18n',
        value: true,
      })
    }
  })
})

describe('getRouteModeFeatures', () => {
  it('should return correct features for manualRoutes', () => {
    const result = getRouteModeFeatures('manualRoutes')
    expect(result).toEqual({
      manualRoutes: true,
      pageRoutes: false,
    })
  })

  it('should return correct features for pageRoutes', () => {
    const result = getRouteModeFeatures('pageRoutes')
    expect(result).toEqual({
      manualRoutes: false,
      pageRoutes: true,
    })
  })

  it('should handle default route mode', () => {
    const result = getRouteModeFeatures('default' as any)
    expect(result).toEqual({
      manualRoutes: false,
      pageRoutes: false,
    })
  })
})

// 🔍 基于文件系统的自动化测试
describe('file System Based Tests', () => {
  describe('scanAllFeatures', () => {
    for (const framework of FRAMEWORKS) {
      it(`should scan all features for ${framework}`, () => {
        const features = scanAllFeatures(framework)

        // 应该至少扫描到一些 features
        expect(features.length).toBeGreaterThan(0)

        console.log(`\n📁 ${framework} features:`, features)
      })
    }
  })

  describe('featureToConfig - All Features', () => {
    for (const framework of FRAMEWORKS) {
      describe(`${framework} framework`, () => {
        const allFeatures = scanAllFeatures(framework)

        it(`should have features scanned from templates/${framework}/`, () => {
          expect(allFeatures.length).toBeGreaterThan(0)
        })

        for (const feature of allFeatures) {
          it(`should map feature "${feature}" correctly or return null if disabled`, () => {
            const result = featureToConfig(feature, framework)

            // 某些 feature 可能被禁用（如 ant-design-vue），返回 null 是正常的
            if (result === null) {
              console.log(`  ⚠️  Feature "${feature}" is disabled in constants`)
              return
            }

            // 如果有映射，应该是有效的
            expect(result).toHaveProperty('key')
            expect(result).toHaveProperty('value')

            // key 应该是有效的配置键
            const validKeys = [
              'uiLibrary',
              'routeMode',
              'i18n',
              'sentry',
              'pinia',
              'zustand',
              'eslint',
              'husky',
            ]
            expect(validKeys).toContain(result.key)
          })
        }
      })
    }
  })

  describe('feature Coverage', () => {
    it('should have UI library features for each framework', () => {
      for (const framework of FRAMEWORKS) {
        const features = scanAllFeatures(framework)
        const uiLibraries = features.filter((f) => {
          const config = featureToConfig(f, framework)
          return config?.key === 'uiLibrary'
        })

        // 每个框架至少应该有一个 UI 库
        expect(uiLibraries.length).toBeGreaterThan(0)
        console.log(`\n📦 ${framework} UI libraries:`, uiLibraries)
      }
    })

    it('should have route mode features for each framework', () => {
      for (const framework of FRAMEWORKS) {
        const features = scanAllFeatures(framework)
        const routeModes = features.filter((f) => {
          const config = featureToConfig(f, framework)
          return config?.key === 'routeMode'
        })

        // 每个框架至少应该有一个路由模式
        expect(routeModes.length).toBeGreaterThan(0)
        console.log(`\n🚦 ${framework} route modes:`, routeModes)
      }
    })
  })
})
