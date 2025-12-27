import type { UserStateType } from '@/types/stores'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create<UserStateType>()(
  persist(
    set => ({
      token: '',
      userInfo: null,
      setToken: (token: string) => set({ token }),
      setUserInfo: (userInfo) => set({ userInfo }),
      logout: () => set({ token: '', userInfo: null }),
    }),
    {
      name: 'user-storage',
    },
  ),
)
