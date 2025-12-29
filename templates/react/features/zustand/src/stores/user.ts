/**
 * 用户状态管理
 * 基于 Zustand
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserInfo {
  id: string
  username: string
  email: string
  avatar?: string
  roles: string[]
}

interface UserState {
  userInfo: UserInfo | null
  token: string
  setUserInfo: (info: UserInfo | null) => void
  setToken: (token: string) => void
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
