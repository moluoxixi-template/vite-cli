/**
 * Sentry 错误监控 feature 设置
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'
import { initSentry } from '@/utils/sentry'

/** 执行顺序 - sentry 应该在 router 之后初始化 */
export const order = 30

/**
 * 设置 Sentry
 * @param app - Vue 应用实例
 * @param router - Vue Router 实例
 */
export function setup(app: App, router: Router): void {
  initSentry(app, router, {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  })
}
