/**
 * Feature 设置模块 - Qiankun 微前端模式
 * 使用 Vite 的 glob 导入自动发现并加载所有 feature 模块
 */

import type { Router } from 'react-router-dom'

/**
 * Feature 模块接口
 */
interface FeatureModule {
  /** 初始化 feature 的设置函数 */
  setup?: (router?: Router) => void | Promise<void>
  /** 执行顺序（数字越小越先执行） */
  order?: number
}

// 自动发现所有 feature 模块
const featureModules = import.meta.glob('./features/*.ts', { eager: true })

/**
 * 设置所有 features
 * @param router - React Router 实例（可选）
 */
export async function setupFeatures(router?: Router): Promise<void> {
  const modules = Object.values(featureModules) as FeatureModule[]

  // 按顺序排序（默认 100）
  modules.sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

  for (const mod of modules) {
    await mod.setup?.(router)
  }
}
