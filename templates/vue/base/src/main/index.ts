/**
 * Feature 设置模块
 * 使用 Vite 的 glob 导入自动发现并加载所有 feature 模块
 */

import type { AppContext, UserModule } from '../types'

// 自动发现所有 feature 模块
const featureModules = import.meta.glob<{ install?: UserModule }>('./features/*.ts', { eager: true })

/**
 * 设置所有 features
 * @param ctx - Vue 应用上下文
 */
export async function setupFeatures(ctx: AppContext): Promise<void> {
  const modules = Object.values(featureModules)

  for (const mod of modules) {
    await mod.install?.(ctx)
  }
}
