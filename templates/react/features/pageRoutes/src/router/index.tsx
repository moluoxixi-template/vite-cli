/**
 * 路由配置
 * 文件系统路由模式（基于 vite-plugin-pages）
 */

import type { RouteObject } from 'react-router-dom'
import { createBrowserRouter, createHashRouter } from 'react-router-dom'
import pageRoutes from '~react-pages'
import App from '@/App'

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
  const routes: RouteObject[] = [
    {
      path: '/',
      element: <App />,
      children: pageRoutes,
    },
  ]

  if (historyMode === 'hash') {
    return createHashRouter(routes, { basename })
  }

  return createBrowserRouter(routes, { basename })
}

function normalizeBasename(basename?: string): string {
  const value = (basename || import.meta.env.VITE_APP_CODE || '').trim()
  return value ? `/${value.replace(/^\/+|\/+$/g, '')}` : '/'
}
