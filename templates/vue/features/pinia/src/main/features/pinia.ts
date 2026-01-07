/**
 * Pinia 状态管理 feature 设置
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'
import { store } from '@/stores'

/** 执行顺序 - pinia 应该尽早加载 */
export const order = 10

/**
 * 设置 Pinia store
 * @param app - Vue 应用实例
 * @param _router - Vue Router 实例（未使用）
 */
export function setup(app: App, _router: Router): void {
  app.use(store)
}
