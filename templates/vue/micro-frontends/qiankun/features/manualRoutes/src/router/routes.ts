/**
 * 路由配置
 * 手动配置路由表
 */

/**
 * 路由配置数组
 */
export const routes = [
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/home/index.vue'),
    meta: {
      title: '首页',
    },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/pages/about/index.vue'),
    meta: {
      title: '关于',
    },
  },
]
