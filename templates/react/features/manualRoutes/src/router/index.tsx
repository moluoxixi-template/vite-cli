/**
 * 路由配置
 * 手动配置路由模式
 */

import { createBrowserRouter, createHashRouter } from 'react-router-dom'
import { routes } from './routes'

interface RouterConfig {
  historyMode?: 'hash' | 'history'
  basename?: string
}

/**
 * 创建路由实例
 * @param config 路由配置
 * @returns 路由实例
 */
export function createRouter(config: RouterConfig = {}) {
  const { historyMode = 'history', basename } = config

  if (historyMode === 'hash') {
    return createHashRouter(routes, { basename })
  }

  return createBrowserRouter(routes, { basename })
}

export { routes }

