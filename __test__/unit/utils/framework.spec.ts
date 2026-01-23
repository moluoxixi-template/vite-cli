/**
 * framework.ts 单元测试
 * 测试框架相关工具函数
 */

import { describe, expect, it } from 'vitest'
import { getAutoSelectedStateManagement } from '@/utils/framework'
import { FRAMEWORKS, STATE_MANAGEMENT_MAP } from '@/constants'
import type { FrameworkType } from '@/types'

describe('getAutoSelectedStateManagement', () => {
  describe('正常流程', () => {
    it('应该为 vue 框架返回 pinia', () => {
      const result = getAutoSelectedStateManagement('vue')
      expect(result).toBe('pinia')
    })

    it('应该为 react 框架返回 zustand', () => {
      const result = getAutoSelectedStateManagement('react')
      expect(result).toBe('zustand')
    })

    // 遍历所有框架，确保映射一致
    for (const framework of FRAMEWORKS) {
      it(`应该为 ${framework} 框架返回正确的状态管理库`, () => {
        const result = getAutoSelectedStateManagement(framework)
        expect(result).toBe(STATE_MANAGEMENT_MAP[framework])
      })
    }
  })

  describe('边界条件', () => {
    it('应该对所有已知框架返回非空字符串', () => {
      for (const framework of FRAMEWORKS) {
        const result = getAutoSelectedStateManagement(framework)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
      }
    })
  })

  describe('类型安全', () => {
    it('应该返回字符串类型', () => {
      const result = getAutoSelectedStateManagement('vue')
      expect(typeof result).toBe('string')
    })

    it('应该与 STATE_MANAGEMENT_MAP 保持一致', () => {
      const frameworks: FrameworkType[] = ['vue', 'react']
      for (const framework of frameworks) {
        const result = getAutoSelectedStateManagement(framework)
        expect(result).toBe(STATE_MANAGEMENT_MAP[framework])
      }
    })
  })
})
