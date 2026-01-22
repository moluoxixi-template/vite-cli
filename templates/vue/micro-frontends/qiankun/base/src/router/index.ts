/**
 * 默认路由配置（最小实现）
 * 此文件会被 router feature (manualRoutes/pageRoutes) 覆盖
 */

import { createRouter, createWebHistory } from 'vue-router'

/**
 * 创建路由实例
 * @param props - 可选的渲染属性（用于 qiankun）
 * @returns 路由实例
 */
function getRouter(props?: Record<string, unknown>) {
  const { activeRule: base = import.meta.env.VITE_APP_CODE } = props || {}
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

export default getRouter
