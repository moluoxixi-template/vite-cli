/**
 * Store 类型定义
 */

import type { UserInfoType } from '@/apis/types/user'

/**
 * 用户 Store 状态类型
 */
export interface UserStateType {
  /** 认证 token */
  token: string
  /** 用户信息 */
  userInfo: UserInfoType | null
  /** 设置 token */
  setToken: (token: string) => void
  /** 设置用户信息 */
  setUserInfo: (info: UserInfoType) => void
  /** 登出 */
  logout: () => void
}

