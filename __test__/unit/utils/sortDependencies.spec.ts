/**
 * sortDependencies 单元测试
 */

import { describe, expect, it } from 'vitest'
import { sortDependencies } from '@/utils/sortDependencies'

describe('sortDependencies', () => {
  it('应该按字母顺序排序依赖', () => {
    const deps = {
      'vue': '^3.0.0',
      'axios': '^1.0.0',
      'vue-router': '^4.0.0',
      'pinia': '^2.0.0',
    }

    const sorted = sortDependencies(deps)

    const keys = Object.keys(sorted)
    expect(keys).toEqual(['axios', 'pinia', 'vue', 'vue-router'])
  })

  it('应该处理空对象', () => {
    const deps = {}
    const sorted = sortDependencies(deps)

    expect(sorted).toEqual({})
  })

  it('应该处理单个依赖', () => {
    const deps = { vue: '^3.0.0' }
    const sorted = sortDependencies(deps)

    expect(sorted).toEqual({ vue: '^3.0.0' })
  })

  it('应该保留依赖值', () => {
    const deps = {
      'package-z': '^1.0.0',
      'package-a': '^2.0.0',
      'package-m': 'latest',
    }

    const sorted = sortDependencies(deps)

    expect(sorted).toEqual({
      'package-a': '^2.0.0',
      'package-m': 'latest',
      'package-z': '^1.0.0',
    })
  })

  it('应该处理作用域包', () => {
    const deps = {
      'vue': '^3.0.0',
      '@vue/compiler-sfc': '^3.0.0',
      '@types/node': '^20.0.0',
      'axios': '^1.0.0',
    }

    const sorted = sortDependencies(deps)

    const keys = Object.keys(sorted)
    expect(keys).toEqual(['@types/node', '@vue/compiler-sfc', 'axios', 'vue'])
  })

  it('不应该修改原始对象', () => {
    const deps = {
      vue: '^3.0.0',
      axios: '^1.0.0',
    }

    const original = { ...deps }
    sortDependencies(deps)

    expect(deps).toEqual(original)
  })
})
