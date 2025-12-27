/**
 * Store 类型定义
 */

import type { UserInfoType } from '@/apis/types/user'

/** 用户 Store 状态类型 */
export interface UserStateType {
  token: string
  userInfo: UserInfoType | null
  setToken: (token: string) => void
  setUserInfo: (info: UserInfoType) => void
  logout: () => void
}

