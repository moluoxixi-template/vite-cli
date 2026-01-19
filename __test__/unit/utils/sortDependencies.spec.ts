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

  it('应该正确处理大小写敏感排序', () => {
    const deps = {
      Vue: '^3.0.0',
      vue: '^3.0.0',
      axios: '^1.0.0',
      Axios: '^1.0.0',
    }

    const sorted = sortDependencies(deps)

    const keys = Object.keys(sorted)
    // localeCompare 默认大小写敏感，小写字母排在大写字母之前
    expect(keys).toEqual(['axios', 'Axios', 'vue', 'Vue'])
  })

  it('应该正确处理数字开头的包名', () => {
    const deps = {
      'vue': '^3.0.0',
      '123-package': '^1.0.0',
      'axios': '^1.0.0',
      '456-package': '^1.0.0',
    }

    const sorted = sortDependencies(deps)

    const keys = Object.keys(sorted)
    expect(keys).toEqual(['123-package', '456-package', 'axios', 'vue'])
  })

  it('应该正确处理包含连字符和下划线的包名', () => {
    const deps = {
      'vue-router': '^4.0.0',
      'vue_router': '^4.0.0',
      'vue': '^3.0.0',
      'axios': '^1.0.0',
    }

    const sorted = sortDependencies(deps)

    const keys = Object.keys(sorted)
    // localeCompare 排序：下划线（_）排在连字符（-）之前
    expect(keys).toEqual(['axios', 'vue', 'vue_router', 'vue-router'])
  })

  it('应该正确处理多个作用域包之间的排序', () => {
    const deps = {
      '@vue/compiler-sfc': '^3.0.0',
      '@types/node': '^20.0.0',
      '@types/react': '^18.0.0',
      '@babel/core': '^7.0.0',
      'vue': '^3.0.0',
    }

    const sorted = sortDependencies(deps)

    const keys = Object.keys(sorted)
    expect(keys).toEqual([
      '@babel/core',
      '@types/node',
      '@types/react',
      '@vue/compiler-sfc',
      'vue',
    ])
  })

  it('应该正确处理版本号格式（包括特殊版本）', () => {
    const deps = {
      'package-a': 'file:../local-package',
      'package-b': 'git+https://github.com/user/repo.git',
      'package-c': '^1.0.0',
      'package-d': '*',
    }

    const sorted = sortDependencies(deps)

    expect(sorted).toEqual({
      'package-a': 'file:../local-package',
      'package-b': 'git+https://github.com/user/repo.git',
      'package-c': '^1.0.0',
      'package-d': '*',
    })
  })
})
