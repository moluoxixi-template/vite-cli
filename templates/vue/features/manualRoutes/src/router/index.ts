import { cloneDeep } from 'lodash-es'
import { assign, isEmpty } from 'radash'
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

  const router = createRouter({
    history: createWebHistory(base),
    routes: routesClone,
  })

  router.beforeEach((_, from, next) => {
    if (isEmpty(history.state.current)) {
      assign(history.state, { current: from.fullPath })
    }
    next()
  })

  return router
}

export default getRouter
