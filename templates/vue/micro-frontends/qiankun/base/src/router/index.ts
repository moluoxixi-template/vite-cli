/**
 * 默认路由配置（最小实现）
 * 此文件会被 router feature (manualRoutes/pageRoutes) 覆盖
 */

import { createRouter, createWebHistory } from 'vue-router'

interface RouterProps extends Record<string, unknown> {
  activeRule?: unknown
  data?: {
    activeRule?: unknown
  }
}

/**
 * 创建路由实例
 * @param props - 可选的渲染属性（用于 qiankun）
 * @returns 路由实例
 */
function getRouter(props: RouterProps = {}) {
  const base = resolveRouterBase(props)
  return createRouter({
    history: createWebHistory(base),
    routes: [
      {
        path: '/',
        name: 'home',
        component: () => import('@/App.vue'),
      },
    ],
  })
}

function resolveRouterBase(props: RouterProps): string {
  const activeRule = props.activeRule ?? props.data?.activeRule
  const value = typeof activeRule === 'string'
    ? activeRule
    : import.meta.env.VITE_APP_CODE
  const base = (value || '').trim()
  return base ? `/${base.replace(/^\/+|\/+$/g, '')}` : '/'
}

export default getRouter
