import { describe, expect, it } from 'vitest'

import {
  FRAMEWORKS,
  getMicroFrontendEngineOptions,
  getRouteModeOptions,
  MICRO_FRONTEND_ENGINES,
  ROUTE_MODES,
  UI_LIBRARIES,
} from '@/constants'
import { normalizeProjectConfig } from '@/core/projectConfig'
import type { ProjectConfigType } from '@/types'

function createConfig(overrides: Partial<ProjectConfigType> = {}): ProjectConfigType {
  return {
    projectName: 'capability-test',
    description: 'Capability test',
    author: 'test',
    framework: 'vue',
    uiLibrary: 'element-plus',
    routeMode: 'manualRoutes',
    i18n: false,
    microFrontend: false,
    sentry: false,
    eslint: false,
    husky: false,
    packageManager: 'pnpm',
    targetDir: '/tmp/capability-test',
    ...overrides,
  }
}

describe('项目能力注册表', () => {
  it('只公开已经完成的能力', () => {
    expect(FRAMEWORKS).toEqual(['vue', 'react'])
    expect(UI_LIBRARIES).toEqual({
      vue: ['element-plus'],
      react: ['ant-design'],
    })
    expect(ROUTE_MODES).toEqual(['pageRoutes', 'manualRoutes'])
    expect(MICRO_FRONTEND_ENGINES).toEqual(['qiankun'])
    expect(getRouteModeOptions('vue').map(option => option.value)).toEqual(['pageRoutes', 'manualRoutes'])
    expect(getMicroFrontendEngineOptions('vue').map(option => option.value)).toEqual(['qiankun'])
    expect(getRouteModeOptions('react').map(option => option.value)).toEqual(['pageRoutes', 'manualRoutes'])
    expect(getMicroFrontendEngineOptions('react').map(option => option.value)).toEqual(['qiankun'])
  })
})

describe('normalizeProjectConfig', () => {
  it('从 framework 和 routeMode 生成唯一的 feature 标志', () => {
    expect(normalizeProjectConfig(createConfig())).toMatchObject({
      pinia: true,
      zustand: false,
      manualRoutes: true,
      pageRoutes: false,
      microFrontendEngine: undefined,
    })
  })

  it('接受 Vue qiankun 配置', () => {
    expect(normalizeProjectConfig(createConfig({
      microFrontend: true,
      microFrontendEngine: 'qiankun',
    }))).toMatchObject({
      microFrontend: true,
      microFrontendEngine: 'qiankun',
    })
  })

  it('接受 React qiankun 配置并投影 Zustand', () => {
    expect(normalizeProjectConfig(createConfig({
      framework: 'react',
      uiLibrary: 'ant-design',
      pinia: false,
      zustand: true,
      microFrontend: true,
      microFrontendEngine: 'qiankun',
    }))).toMatchObject({
      pinia: false,
      zustand: true,
      microFrontend: true,
      microFrontendEngine: 'qiankun',
    })
  })

  it.each([
    ['未知 framework', { framework: 'solid' as ProjectConfigType['framework'] }, '不支持的框架'],
    ['framework 不支持的 UI', { uiLibrary: 'ant-design-vue' }, 'uiLibrary'],
    ['冲突的 route feature', { manualRoutes: false }, 'manualRoutes'],
    ['冲突的 state feature', { zustand: true }, 'zustand'],
    ['缺失微前端 engine', { microFrontend: true }, '必须提供 microFrontendEngine'],
    [
      '未开放的微前端 engine',
      { microFrontend: true, microFrontendEngine: 'micro-app' },
      'microFrontendEngine',
    ],
    [
      '禁用微前端时仍提供 engine',
      { microFrontend: false, microFrontendEngine: 'qiankun' },
      '不能提供 microFrontendEngine',
    ],
  ] satisfies Array<[string, Partial<ProjectConfigType>, string]>)('%s 时明确失败', (_, overrides, message) => {
    expect(() => normalizeProjectConfig(createConfig(overrides))).toThrow(message)
  })
})
