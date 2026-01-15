/**
 * 默认路由配置（最小实现）
 * 此文件会被 router feature (manualRoutes/pageRoutes) 覆盖
 */

import { createRouter, createWebHistory } from 'vue-router'

/**
 * 创建路由实例
 * @returns 路由实例
 */
function getRouter() {
  return createRouter({
    history: createWebHistory(),
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
