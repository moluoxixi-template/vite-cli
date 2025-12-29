/**
 * 用户服务
 * 用户相关 API
 */

import type { ApiResponseType, LoginParamsType, LoginResponseType, UserInfoType } from '../types'

import request from '../request'

/**
 * 用户登录
 * @param params 登录参数
 * @returns 登录响应（包含 token 和用户信息）
 */
export function login(params: LoginParamsType): Promise<ApiResponseType<LoginResponseType>> {
  return request.post('/auth/login', params)
}

/**
 * 获取用户信息
 * @returns 用户信息响应
 */
export function getUserInfo(): Promise<ApiResponseType<UserInfoType>> {
  return request.get('/user/info')
}

/**
 * 用户登出
 * @returns 登出响应
 */
export function logout(): Promise<ApiResponseType<null>> {
  return request.post('/auth/logout')
}
