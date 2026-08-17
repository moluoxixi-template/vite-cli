/**
 * 路由配置
 * 手动配置路由表，支持懒加载
 */

import type { RouteObject } from 'react-router-dom'
import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import App from '@/App'

const Home = lazy(() => import('@/pages/home'))
const About = lazy(() => import('@/pages/about'))
const Guide = lazy(() => import('@/pages/guide'))
const Advanced = lazy(() => import('@/pages/guide/advanced'))
const Topic = lazy(() => import('@/pages/guide/advanced/topic'))

/**
 * 懒加载包装组件
 * @param params
 * @param params.children 要懒加载的子组件
 * @returns 带 Suspense 的组件
 */
function LazyLoad({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
}

/**
 * 路由配置数组
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <LazyLoad><Home /></LazyLoad>,
      },
      {
        path: 'about',
        element: <LazyLoad><About /></LazyLoad>,
      },
      {
        path: 'guide',
        element: <LazyLoad><Guide /></LazyLoad>,
        children: [
          {
            path: 'advanced',
            element: <LazyLoad><Advanced /></LazyLoad>,
            children: [
              {
                path: 'topic',
                element: <LazyLoad><Topic /></LazyLoad>,
              },
            ],
          },
        ],
      },
    ],
  },
]
