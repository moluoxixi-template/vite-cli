/**
 * 框架相关工具函数
 * 处理框架相关的查询和转换逻辑
 */

import type { FrameworkType } from '../types/index.ts'

import { STATE_MANAGEMENT_MAP } from '../constants/index.ts'

/**
 * 获取框架对应的自动选择的状态管理库 feature 名称
 * @param framework 框架类型
 * @returns 状态管理库 feature 名称
 */
export function getAutoSelectedStateManagement(framework: FrameworkType): string {
  return STATE_MANAGEMENT_MAP[framework]
}
