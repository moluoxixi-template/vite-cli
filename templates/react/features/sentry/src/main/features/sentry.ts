/**
 * Sentry 错误监控 feature 设置
 */

import type { Router } from 'react-router-dom'
import { initSentry } from '@/utils/sentry'

/** 执行顺序 */
export const order = 20

/**
 * 设置 Sentry
 * @param _router - React Router 实例（React Sentry 中未使用）
 */
export function setup(_router?: Router): void {
  initSentry({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  })
}
