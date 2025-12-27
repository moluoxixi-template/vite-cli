/**
 * 用户状态管理
 */

import type { UserInfo } from '@/apis/types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore(
  'user',
  () => {
    /** 用户信息 */
    const userInfo = ref<UserInfo | null>(null);

    /** token */
    const token = ref<string>('');

    /** 设置用户信息 */
    function setUserInfo(info: UserInfo | null): void {
      userInfo.value = info;
    }

    /** 设置 token */
    function setToken(value: string): void {
      token.value = value;
    }

    /** 清除用户信息 */
    function clearUser(): void {
      userInfo.value = null;
      token.value = '';
    }

    return {
      userInfo,
      token,
      setUserInfo,
      setToken,
      clearUser,
    };
  },
  {
    persist: {
      pick: ['token'],
    },
  }
);

