import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'
import type { UserConfig } from 'vite'
import { createJiti } from 'jiti'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const _require = createJiti(import.meta.url, { interopDefault: true })

/**
 * Vite feature 配置上下文
 */
export interface ViteFeatureContext {
  /** Vite 环境变量 */
  viteEnv: Record<string, any>
  /** 构建模式 */
  mode: string
  /** 应用代码 */
  appCode: string
}

/**
 * 加载所有 feature 的 Vite 配置
 * @param ctx - feature 配置上下文
 * @returns 合并后的 UserConfig
 */
export function loadFeatureConfigs(ctx: ViteFeatureContext): UserConfig {
  const featuresDir = path.resolve(__dirname, 'features')

  if (!fs.existsSync(featuresDir)) {
    return {}
  }

  const featureFiles = fs.readdirSync(featuresDir).filter(f => f.endsWith('.ts'))
  const configs: UserConfig[] = []

  for (const file of featureFiles) {
    try {
      const filePath = path.resolve(featuresDir, file)
      const mod = _require(filePath)
      const config = mod.default(ctx)
      if (config) {
        configs.push(config)
      }
    }
    catch (e) {
      console.warn(`[Vite] Failed to load feature config: ${file}`, e)
    }
  }

  return configs.reduce((acc, cfg) => mergeConfig(acc, cfg), {} as UserConfig)
}
