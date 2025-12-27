/**
 * 用户类型定义
 */

/** 用户信息类型 */
export interface UserInfoType {
  id: string
  username: string
  email: string
  avatar?: string
  roles: string[]
}

/** 登录参数类型 */
export interface LoginParamsType {
  username: string
  password: string
}

/** 登录响应类型 */
export interface LoginResponseType {
  token: string
  userInfo: UserInfoType
}
