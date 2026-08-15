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
  const { historyMode = 'history' } = config
  const basename = normalizeBasename(config.basename)

  if (historyMode === 'hash') {
    return createHashRouter(routes, { basename })
  }

  return createBrowserRouter(routes, { basename })
}

function normalizeBasename(basename?: string): string {
  const value = (basename || import.meta.env.VITE_APP_CODE || '').trim()
  return value ? `/${value.replace(/^\/+|\/+$/g, '')}` : '/'
}

export { routes }
