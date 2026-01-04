/**
 * 路由模式映射工具
 * 统一处理路由模式的映射和转换逻辑
 */

import type { RouteModeType } from '../types/index.ts'

/**
 * 根据路由模式获取对应的布尔特征配置
 * @param routeMode 路由模式（'pageRoutes' | 'manualRoutes'）
 * @returns 包含 manualRoutes 和 pageRoutes 布尔值的对象
 */
export function getRouteModeFeatures(routeMode: RouteModeType): {
  manualRoutes: boolean
  pageRoutes: boolean
} {
  return {
    manualRoutes: routeMode === 'manualRoutes',
    pageRoutes: routeMode === 'pageRoutes',
  }
}
