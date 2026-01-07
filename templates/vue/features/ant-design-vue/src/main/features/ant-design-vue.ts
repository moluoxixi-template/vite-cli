/**
 * Ant Design Vue UI 组件库 feature 设置
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'

/** 执行顺序 - 样式应该尽早加载 */
export const order = 5

/**
 * 设置 Ant Design Vue
 * @param _app - Vue 应用实例（未使用，自动导入）
 * @param _router - Vue Router 实例（未使用）
 */
export function setup(_app: App, _router: Router): void {
  // Ant Design Vue 通过 unplugin-vue-components 自动导入
}
