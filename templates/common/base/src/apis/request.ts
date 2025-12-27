/**
 * 请求封装
 * 基于 @moluoxixi/ajax-package 的请求工具
 */

import { createRequest } from '@moluoxixi/ajax-package'

/** 请求实例 */
export const request = createRequest({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** 请求拦截器 */
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

/** 响应拦截器 */
request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 统一错误处理
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)

export default request
