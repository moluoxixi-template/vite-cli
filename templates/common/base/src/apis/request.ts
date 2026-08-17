/**
 * 请求封装
 * 基于项目内置 Ajax 源码的请求工具
 */

import { BaseApi } from './ajax'

/**
 * 自定义 API 类
 * 继承 BaseApi 并扩展请求处理逻辑
 */
class RequestApi extends BaseApi {
  constructor(config = {}) {
    super({
      baseURL: import.meta.env.VITE_API_BASE_URL || '',
      timeout: import.meta.env.VITE_TIMEOUT || 30000,
      ...config,
    })
  }

  /**
   * 处理请求配置
   * 在请求发送之前进行一些处理
   * 对应旧代码的请求拦截器逻辑
   */
  processRequestConfig(config: any) {
    return config
  }
}

/** 请求实例 */
export const request = new RequestApi()

export default request
