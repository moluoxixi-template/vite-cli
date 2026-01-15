/**
 * sortDependencies 单元测试
 */

import { describe, expect, it } from 'vitest'
import { sortDependencies } from '@/utils/sortDependencies'

describe('sortDependencies', () => {
  it('should sort dependencies alphabetically', () => {
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

  it('should handle empty object', () => {
    const deps = {}
    const sorted = sortDependencies(deps)

    expect(sorted).toEqual({})
  })

  it('should handle single dependency', () => {
    const deps = { vue: '^3.0.0' }
    const sorted = sortDependencies(deps)

    expect(sorted).toEqual({ vue: '^3.0.0' })
  })

  it('should preserve dependency values', () => {
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

  it('should handle scoped packages', () => {
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

  it('should not modify the original object', () => {
    const deps = {
      vue: '^3.0.0',
      axios: '^1.0.0',
    }

    const original = { ...deps }
    sortDependencies(deps)

    expect(deps).toEqual(original)
  })
})
