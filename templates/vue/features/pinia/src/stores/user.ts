import type { UserInfoType } from '@/apis/types/user'

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref('')
    const userInfo = ref<UserInfoType | null>(null)

    function setToken(value: string): void {
      token.value = value
    }

    function setUserInfo(value: UserInfoType): void {
      userInfo.value = value
    }

    function logout(): void {
      token.value = ''
      userInfo.value = null
    }

    return {
      token,
      userInfo,
      setToken,
      setUserInfo,
      logout,
    }
  },
  {
    persist: true,
  },
)
