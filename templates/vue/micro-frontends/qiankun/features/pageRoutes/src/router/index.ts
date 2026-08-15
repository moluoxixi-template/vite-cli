import { cloneDeep } from 'lodash-es'
import { assign, isEmpty } from 'radash'
import routes from '~pages'
import { createRouter, createWebHistory } from 'vue-router'

interface RouterProps extends Record<string, unknown> {
  activeRule?: unknown
  data?: {
    activeRule?: unknown
  }
}

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
]

/**
 * 创建路由实例（Qiankun 微前端模式）
 * @param props Qiankun 传递的属性
 * @returns 路由实例
 */
function getRouter(props: RouterProps = {}) {
  const routesClone = cloneDeep(Routes)
  const base = resolveRouterBase(props)

  const router = createRouter({
    history: createWebHistory(base),
    routes: routesClone,
  })

  /**
   * 微前端环境下，解决vue-router大版本路由不兼容问题
   * @issue https://github.com/umijs/qiankun/issues/2254
   */
  router.beforeEach((_, from, next) => {
    if (isEmpty(history.state.current)) {
      assign(history.state, { current: from.fullPath })
    }
    next()
  })

  return router
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
