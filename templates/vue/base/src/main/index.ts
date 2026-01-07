/**
 * Feature 设置模块
 * 使用 Vite 的 glob 导入自动发现并加载所有 feature 模块
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'

/**
 * Feature 模块接口
 */
interface FeatureModule {
  /** 初始化 feature 的设置函数 */
  setup?: (app: App, router: Router) => void | Promise<void>
  /** 执行顺序（数字越小越先执行） */
  order?: number
}

// 自动发现所有 feature 模块
const featureModules = import.meta.glob('./features/*.ts', { eager: true })

/**
 * 设置所有 features
 * @param app - Vue 应用实例
 * @param router - Vue Router 实例
 */
export async function setupFeatures(app: App, router: Router): Promise<void> {
  const modules = Object.values(featureModules) as FeatureModule[]

  // 按顺序排序（默认 100）
  modules.sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

  for (const mod of modules) {
    await mod.setup?.(app, router)
  }
}
