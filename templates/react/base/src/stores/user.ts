/**
 * 用户状态管理
 * 基于 Zustand
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 用户信息接口
 */
interface UserInfo {
  /** 用户 ID */
  id: string
  /** 用户名 */
  username: string
  /** 邮箱 */
  email: string
  /** 头像 URL（可选） */
  avatar?: string
  /** 角色列表 */
  roles: string[]
}

/**
 * 用户状态接口
 */
interface UserState {
  /** 用户信息 */
  userInfo: UserInfo | null
  /** 认证 token */
  token: string
  /** 设置用户信息 */
  setUserInfo: (info: UserInfo | null) => void
  /** 设置 token */
  setToken: (token: string) => void
  /** 清除用户信息 */
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      userInfo: null,
      token: '',
      setUserInfo: info => set({ userInfo: info }),
      setToken: token => set({ token }),
      clearUser: () => set({ userInfo: null, token: '' }),
    }),
    {
      name: 'user-storage',
      partialize: state => ({ token: state.token }),
    },
  ),
)
