/**
 * I18n 国际化 feature 设置
 */

import type { Router } from 'react-router-dom'

// 导入 i18n 以初始化
import '@/locales'

/** 执行顺序 */
export const order = 10

/**
 * 设置 i18n（导入时自动初始化）
 * @param _router - React Router 实例（未使用）
 */
export function setup(_router?: Router): void {
  // i18n 在导入时自动初始化
}
