import { cloneDeep } from 'lodash-es'
import { assign, isEmpty } from 'radash'
import { routes } from './routes'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
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
 * 创建路由实例（Qiankun 微前端模式）
 * @param props Qiankun 传递的属性
 * @returns 路由实例
 */
function getRouter(props: any = {}) {
  let base: string
  const routesClone = cloneDeep(Routes)

  if (qiankunWindow.__POWERED_BY_QIANKUN__) {
    // 微前端模式：使用主应用传递的 activeRule
    const { activeRule } = props.data || {}
    base = activeRule || import.meta.env.VITE_APP_CODE
  }
  else {
    // 独立运行模式
    base = import.meta.env.VITE_APP_CODE
  }

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
