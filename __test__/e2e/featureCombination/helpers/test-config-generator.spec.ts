import { describe, expect, it } from 'vitest'

import { createConfigMatrixSlug } from '@/core/configMatrix'
import { normalizeProjectConfig } from '@/core/projectConfig'
import type { ProjectConfigType } from '@/types'
import { generateTestConfigs } from './test-config-generator'

describe('合法组合生成器', () => {
  it('枚举 Vue/React 的全部 384 个合法组合', () => {
    const configs = generateTestConfigs()

    expect(configs).toHaveLength(384)
    expect(new Set(configs.map(config => config.name)).size).toBe(384)
    expect(configs.filter(config => config.config.framework === 'vue')).toHaveLength(192)
    expect(configs.filter(config => config.config.framework === 'react')).toHaveLength(192)
    expect(configs.filter(config => config.config.microFrontend)).toHaveLength(192)
    expect(new Set(configs.map(config => createConfigMatrixSlug(config.config))).size).toBe(384)

    for (const testConfig of configs) {
      expect(() => normalizeProjectConfig({
        ...testConfig.config,
        targetDir: '/tmp/legal-combination',
      } as ProjectConfigType)).not.toThrow()
    }
  })

  it('minimal 模式保留每个结构组合的全关和全开状态', () => {
    const configs = generateTestConfigs({
      minimal: true,
      combinations: {
        packageManagers: ['pnpm'],
      },
    })

    expect(configs).toHaveLength(16)
    expect(configs.some(config => config.config.i18n && config.config.sentry)).toBe(true)
    expect(configs.some(config => !config.config.i18n && !config.config.sentry)).toBe(true)
  })

  it('为完整能力轴生成稳定的公开 slug', () => {
    const [config] = generateTestConfigs({
      combinations: {
        frameworks: ['react'],
        uiLibraries: { react: ['ant-design'] },
        routeModes: ['manualRoutes'],
        microFrontendEngines: ['qiankun'],
        packageManagers: ['yarn'],
        i18n: false,
        sentry: false,
        eslint: false,
        husky: false,
      },
      defaults: {
        i18n: true,
        sentry: false,
        eslint: true,
        husky: false,
      },
    })

    expect(createConfigMatrixSlug(config!.config))
      .toBe('v1-react-ant-design-standard-manual-yarn-i1-s0-e1-h0')
  })
})
