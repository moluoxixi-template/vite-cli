import { cloneDeep } from 'lodash-es'
import { assign, isEmpty } from 'radash'
import routes from '~pages'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
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

function getRouter(props: any) {
  let base: string
  const routes = cloneDeep(Routes)
  if (qiankunWindow.__POWERED_BY_QIANKUN__) {
    const { activeRule } = props.data
    base = activeRule
  }
  else {
    base = import.meta.env.VITE_APP_CODE
  }
  const router = createRouter({
    history: createWebHistory(base),
    routes,
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
