/**
 * deepMerge 单元测试
 */

import { describe, expect, it } from 'vitest'
import { deepMerge } from '@/utils/deepMerge'

describe('deepMerge', () => {
  it('应该合并两个简单对象', () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('应该合并嵌套对象', () => {
    const target = { a: { x: 1, y: 2 } }
    const source = { a: { y: 3, z: 4 } }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: { x: 1, y: 3, z: 4 } })
  })

  it('应该合并并去重数组', () => {
    const target = { arr: [1, 2, 3] }
    const source = { arr: [4, 5] }
    const result = deepMerge(target, source)

    // 数组应该合并并去重
    expect(result).toEqual({ arr: [1, 2, 3, 4, 5] })
  })

  it('应该对具有相同值的数组去重', () => {
    const target = { arr: [1, 2, 3] }
    const source = { arr: [2, 3, 4] }
    const result = deepMerge(target, source)

    // 重复的值应该被去重
    expect(result).toEqual({ arr: [1, 2, 3, 4] })
  })

  it('应该处理深层嵌套对象', () => {
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

  it('应该处理 null 和 undefined', () => {
    const target = { a: null, b: undefined }
    const source = { b: 2, c: 3 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: null, b: 2, c: 3 })
  })

  it('不应该修改原始对象', () => {
    const target = { a: 1, nested: { x: 1 } }
    const source = { b: 2, nested: { y: 2 } }
    const originalTarget = JSON.parse(JSON.stringify(target))
    const originalSource = JSON.parse(JSON.stringify(source))

    deepMerge(target, source)

    expect(target).toEqual(originalTarget)
    expect(source).toEqual(originalSource)
  })

  it('应该处理空对象', () => {
    const target = {}
    const source = { a: 1 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1 })
  })

  it('应该合并类似 package.json 的对象', () => {
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

  it('应该处理数组元素为对象的情况', () => {
    const target = { items: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] }
    const source = { items: [{ id: 2, name: 'b' }, { id: 3, name: 'c' }] }
    const result = deepMerge(target, source)

    // 数组会合并并去重，但对象引用不同，Set 无法去重对象
    expect(result.items).toHaveLength(4)
    expect(result.items).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
    ])
  })

  it('应该处理数组包含 null 和 undefined 的情况', () => {
    const target = { arr: [1, null, 2] }
    const source = { arr: [null, undefined, 3] }
    const result = deepMerge(target, source)

    // null 会被保留，undefined 会被过滤（因为 Set 的行为）
    expect(result.arr).toContain(null)
    expect(result.arr).toContain(1)
    expect(result.arr).toContain(2)
    expect(result.arr).toContain(3)
  })

  it('应该处理混合类型场景（对象被数组覆盖）', () => {
    const target = { key: { a: 1, b: 2 } }
    const source = { key: [1, 2, 3] }
    const result = deepMerge(target, source)

    // 数组应该覆盖对象
    expect(result).toEqual({ key: [1, 2, 3] })
  })

  it('应该处理混合类型场景（数组被对象覆盖）', () => {
    const target = { key: [1, 2, 3] }
    const source = { key: { a: 1, b: 2 } }
    const result = deepMerge(target, source)

    // 对象应该覆盖数组
    expect(result).toEqual({ key: { a: 1, b: 2 } })
  })

  it('应该处理源对象为空的情况', () => {
    const target = { a: 1, b: { x: 2 } }
    const source = {}
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1, b: { x: 2 } })
  })

  it('应该跳过源对象中值为 undefined 的键', () => {
    const target = { a: 1, b: 2 }
    const source = { b: undefined, c: 3 }
    const result = deepMerge(target, source)

    // b 应该保持原值，因为 undefined 会被跳过
    expect(result).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('应该处理基本类型覆盖（字符串、数字、布尔值）', () => {
    const target = {
      str: 'old',
      num: 1,
      bool: true,
    }
    const source = {
      str: 'new',
      num: 2,
      bool: false,
    }
    const result = deepMerge(target, source)

    expect(result).toEqual({
      str: 'new',
      num: 2,
      bool: false,
    })
  })

  it('应该处理复杂嵌套场景（对象和数组混合）', () => {
    const target = {
      config: {
        plugins: ['plugin1', 'plugin2'],
        options: {
          debug: true,
        },
      },
    }
    const source = {
      config: {
        plugins: ['plugin2', 'plugin3'],
        options: {
          verbose: true,
        },
      },
    }
    const result = deepMerge(target, source)

    expect(result).toEqual({
      config: {
        plugins: ['plugin1', 'plugin2', 'plugin3'],
        options: {
          debug: true,
          verbose: true,
        },
      },
    })
  })
})
