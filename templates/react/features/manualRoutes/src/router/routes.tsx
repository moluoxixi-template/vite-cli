/**
 * 路由配置
 * 手动配置路由表，支持懒加载
 */

import type { RouteObject } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const Home = lazy(() => import('@/pages/home'))
const About = lazy(() => import('@/pages/about'))

/**
 * 懒加载包装组件
 * @param children 要懒加载的子组件
 * @returns 带 Suspense 的组件
 */
function LazyLoad({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
}

/**
 * 路由配置数组
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <LazyLoad><Home /></LazyLoad>,
  },
  {
    path: '/about',
    element: <LazyLoad><About /></LazyLoad>,
  },
]

