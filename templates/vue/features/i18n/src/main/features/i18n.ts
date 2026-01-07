/**
 * I18n 国际化 feature 设置
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'
import i18n from '@/locales'

/** 执行顺序 */
export const order = 20

/**
 * 设置 i18n
 * @param app - Vue 应用实例
 * @param _router - Vue Router 实例（未使用）
 */
export function setup(app: App, _router: Router): void {
  app.use(i18n)
}
