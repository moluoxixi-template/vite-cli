/**
 * 用户类型定义
 */

/**
 * 用户信息类型
 */
export interface UserInfoType {
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
 * 登录参数类型
 */
export interface LoginParamsType {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
}

/**
 * 登录响应类型
 */
export interface LoginResponseType {
  /** 认证 token */
  token: string
  /** 用户信息 */
  userInfo: UserInfoType
}
