import { cloneDeep } from 'lodash-es'
import { routes } from './routes'
import { createRouter, createWebHistory } from 'vue-router'

// 手动配置的路由
const Routes = [
  {
    path: '/',
    name: 'layout',
    component: () => import('@/router/layout.vue' as string),
    redirect: routes[0]?.path,
    children: routes,
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
  const base = import.meta.env.VITE_APP_CODE
  const routesClone = cloneDeep(Routes)

  return createRouter({
    history: createWebHistory(base),
    routes: routesClone,
  })
}

export default getRouter
