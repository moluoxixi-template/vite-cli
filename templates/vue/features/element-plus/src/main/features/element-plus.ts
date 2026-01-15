/**
 * Element Plus UI 组件库 feature 设置
 * 导入 Element Plus 样式
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'

// 导入 Element Plus 样式
import '@/assets/styles/element.scss'

/** 执行顺序 - 样式应该尽早加载 */
export const order = 5

/**
 * 设置 Element Plus
 * @param _app - Vue 应用实例（未使用，样式已导入）
 * @param _router - Vue Router 实例（未使用）
 */
export function setup(_app: App, _router: Router): void {
  // Element Plus 通过 unplugin-vue-components 自动导入
  // 只需要导入样式
}
