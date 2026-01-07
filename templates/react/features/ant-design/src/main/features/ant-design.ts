/**
 * Ant Design UI 组件库 feature 设置
 * 导入 Ant Design 样式
 */

import type { Router } from 'react-router-dom'

// 导入 Ant Design 重置样式
import 'antd/dist/reset.css'

/** 执行顺序 - 样式应该尽早加载 */
export const order = 5

/**
 * 设置 Ant Design
 * @param _router - React Router 实例（未使用）
 */
export function setup(_router?: Router): void {
  // Ant Design 组件在组件中直接导入
  // 这里只需要导入样式
}
