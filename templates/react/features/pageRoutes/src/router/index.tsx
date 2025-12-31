/**
 * 路由配置
 * 文件系统路由模式（基于 vite-plugin-pages）
 */

import { createBrowserRouter, createHashRouter } from 'react-router-dom'
// @ts-expect-error - vite-plugin-pages 自动生成
import routes from '~react-pages'

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
