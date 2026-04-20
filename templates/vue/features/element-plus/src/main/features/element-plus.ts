/**
 * Element Plus UI 组件库 feature 设置
 * 导入 Element Plus 样式
 */

import type { UserModule } from '@/types'

// 导入 Element Plus 样式
import '@/assets/styles/element/index.scss'



/**
 * 设置 Element Plus
 * @param ctx - Vue 应用上下文（未使用，样式已导入）
 */
export const install: UserModule = (_ctx) => {
  // Element Plus 通过 unplugin-vue-components 自动导入
  // 只需要导入样式
}
