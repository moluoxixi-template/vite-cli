/**
 * 默认路由配置（最小实现）
 * 此文件会被 router feature (manualRoutes/pageRoutes) 覆盖
 */

import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import About from '@/pages/about'
import Home from '@/pages/home'

interface RouterConfig {
  historyMode?: 'hash' | 'history'
  basename?: string
}

/**
 * 创建路由实例
 * @param _config 路由配置（默认实现中未使用）
 * @returns 路由实例
 */
export function createRouter(_config: RouterConfig = {}) {
  const basename = normalizeBasename(_config.basename)
  return createBrowserRouter([
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Home /> },
        { path: 'about', element: <About /> },
      ],
    },
  ], { basename })
}

function normalizeBasename(basename?: string): string {
  const value = (basename || import.meta.env.VITE_APP_CODE || '').trim()
  return value ? `/${value.replace(/^\/+|\/+$/g, '')}` : '/'
}
