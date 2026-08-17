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
  {
    path: '/guide',
    name: 'Guide',
    component: () => import('@/pages/guide/index.vue'),
    meta: {
      title: '指南',
    },
    children: [
      {
        path: 'advanced',
        name: 'GuideAdvanced',
        component: () => import('@/pages/guide/advanced/index.vue'),
        meta: {
          title: '进阶',
        },
        children: [
          {
            path: 'topic',
            name: 'GuideTopic',
            component: () => import('@/pages/guide/advanced/topic/index.vue'),
            meta: {
              title: '三级标题',
            },
          },
        ],
      },
    ],
  },
]
