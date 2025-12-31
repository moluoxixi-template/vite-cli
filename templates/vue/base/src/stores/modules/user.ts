import { defineStore } from 'pinia'
import { ref } from 'vue'
import { store } from '@/stores'

export const userStore = defineStore(
  'user',
  () => {
    // 定义token
    const token = ref('')

    /**
     * 用户登录
     * @param userInfo 用户信息（可选，qiankun 环境下可能从主应用传递）
     */
    const userLogin = async (userInfo?: any) => {
      // 如果传递了用户信息，可以在这里处理登录逻辑
      // 例如：设置 token、保存用户信息等
      if (userInfo) {
        // 可以根据实际需求处理用户信息
        console.log('User login with info:', userInfo)
      }
    }

    /**
     * 获取 token
     * @returns token 值
     */
    const getToken = () => {
      return token.value
    }

    return { getToken, userLogin, token }
  },
  {
    persist: true,
  },
)

export function useUserStore() {
  return userStore(store)
}

