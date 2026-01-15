/**
 * deepMerge 单元测试
 */

import { describe, expect, it } from 'vitest'
import { deepMerge } from '@/utils/deepMerge'

describe('deepMerge', () => {
  it('should merge two simple objects', () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('should merge nested objects', () => {
    const target = { a: { x: 1, y: 2 } }
    const source = { a: { y: 3, z: 4 } }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: { x: 1, y: 3, z: 4 } })
  })

  it('should merge and deduplicate arrays', () => {
    const target = { arr: [1, 2, 3] }
    const source = { arr: [4, 5] }
    const result = deepMerge(target, source)

    // 数组应该合并并去重
    expect(result).toEqual({ arr: [1, 2, 3, 4, 5] })
  })

  it('should deduplicate arrays with same values', () => {
    const target = { arr: [1, 2, 3] }
    const source = { arr: [2, 3, 4] }
    const result = deepMerge(target, source)

    // 重复的值应该被去重
    expect(result).toEqual({ arr: [1, 2, 3, 4] })
  })

  it('should handle deep nested objects', () => {
    const target = {
      level1: {
        level2: {
          level3: {
            value: 'old',
          },
        },
      },
    }
    const source = {
      level1: {
        level2: {
          level3: {
            value: 'new',
            newProp: 'added',
          },
        },
      },
    }
    const result = deepMerge(target, source)

    expect(result).toEqual({
      level1: {
        level2: {
          level3: {
            value: 'new',
            newProp: 'added',
          },
        },
      },
    })
  })

  it('should handle null and undefined', () => {
    const target = { a: null, b: undefined }
    const source = { b: 2, c: 3 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: null, b: 2, c: 3 })
  })

  it('should not modify the original objects', () => {
    const target = { a: 1, nested: { x: 1 } }
    const source = { b: 2, nested: { y: 2 } }
    const originalTarget = JSON.parse(JSON.stringify(target))
    const originalSource = JSON.parse(JSON.stringify(source))

    deepMerge(target, source)

    expect(target).toEqual(originalTarget)
    expect(source).toEqual(originalSource)
  })

  it('should handle empty objects', () => {
    const target = {}
    const source = { a: 1 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1 })
  })

  it('should merge package.json-like objects', () => {
    const target = {
      dependencies: {
        vue: '^3.0.0',
        axios: '^1.0.0',
      },
      devDependencies: {
        vite: '^5.0.0',
      },
    }

    const source = {
      dependencies: {
        'vue-router': '^4.0.0',
        'axios': '^1.5.0', // 应该覆盖
      },
      devDependencies: {
        typescript: '^5.0.0',
      },
    }

    const result = deepMerge(target, source)

    expect(result).toEqual({
      dependencies: {
        'vue': '^3.0.0',
        'vue-router': '^4.0.0',
        'axios': '^1.5.0', // 被覆盖
      },
      devDependencies: {
        vite: '^5.0.0',
        typescript: '^5.0.0',
      },
    })
  })
})
