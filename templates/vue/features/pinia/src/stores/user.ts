/**
 * 用户状态管理
 */

import type { UserInfo } from '@/apis/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    /** 用户信息 */
    const userInfo = ref<UserInfo | null>(null)

    /** token */
    const token = ref<string>('')

    /**
     * 设置用户信息
     * @param info 用户信息，为 null 时清空
     */
    function setUserInfo(info: UserInfo | null): void {
      userInfo.value = info
    }

    /**
     * 设置 token
     * @param value token 值
     */
    function setToken(value: string): void {
      token.value = value
    }

    /**
     * 清除用户信息
     * 清空用户信息和 token
     */
    function clearUser(): void {
      userInfo.value = null
      token.value = ''
    }

    return {
      userInfo,
      token,
      setUserInfo,
      setToken,
      clearUser,
    }
  },
  {
    persist: {
      pick: ['token'],
    },
  },
)
