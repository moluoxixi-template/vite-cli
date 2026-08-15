import { cloneDeep } from 'lodash-es'
import routes from '~pages'
import { createRouter, createWebHistory } from 'vue-router'

// 自动生成的路由
const routesChildrens = routes
const Routes = [
  {
    path: '/',
    name: 'layout',
    component: () => import('@/router/layout.vue' as string),
    redirect: routes[0]?.path,
    children: routesChildrens,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

/**
 * 创建路由实例
 * @returns 路由实例
 */
function getRouter() {
  const base = normalizeRouterBase(import.meta.env.VITE_APP_CODE)
  const routesClone = cloneDeep(Routes)

  return createRouter({
    history: createWebHistory(base),
    routes: routesClone,
  })
}

function normalizeRouterBase(value?: string): string {
  const base = (value || '').trim()
  return base ? `/${base.replace(/^\/+|\/+$/g, '')}` : '/'
}

export default getRouter
