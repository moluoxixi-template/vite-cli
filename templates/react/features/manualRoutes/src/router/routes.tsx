import type { RouteObject } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const Home = lazy(() => import('@/pages/home'))
const About = lazy(() => import('@/pages/about'))

function LazyLoad({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
}

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

