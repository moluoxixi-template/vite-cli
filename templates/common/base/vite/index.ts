import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'
import type { UserConfig } from 'vite'
import type { ViteConfigType, ViteFeatureContext } from '@moluoxixi/vite-config'
import { createJiti } from 'jiti'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const _require = createJiti(import.meta.url, { interopDefault: true })

import type { ConfigEnv } from 'vite'

/**
 * 加载所有 feature 的 Vite 配置
 * @param ctx - feature 配置上下文
 * @returns 合并后的 Config 配置（与 ViteConfigType 结构一致）
 */
export async function loadFeatureConfigs(ctx: ViteFeatureContext & ConfigEnv): Promise<Partial<ViteConfigType>> {
  const featuresDir = path.resolve(__dirname, 'features')

  if (!fs.existsSync(featuresDir)) {
    return {}
  }

  const featureFiles = fs.readdirSync(featuresDir).filter(f => f.endsWith('.ts'))
  const viteConfigs: UserConfig[] = []
  let mergedConfig: Partial<ViteConfigType> = {}

  for (const file of featureFiles) {
    try {
      const filePath = path.resolve(featuresDir, file)
      const mod = _require(filePath)
      const config = mod.default(ctx) as Partial<ViteConfigType> | undefined
      if (config) {
        // 提取 viteConfig 单独合并
        let { viteConfig, ...restConfig } = config
        
        if (viteConfig) {
          if (typeof viteConfig === 'function') {
             // Pass ConfigEnv down to the function mapping and wait for it
             viteConfig = await viteConfig(ctx)
          }
          viteConfigs.push(viteConfig as UserConfig)
        }
        
        // 合并其他配置（pageRoutes, autoComponent 等）
        mergedConfig = { ...mergedConfig, ...restConfig }
      }
    }
    catch (e) {
      console.warn(`[Vite] Failed to load feature config: ${file}`, e)
    }
  }

  // 合并所有 viteConfig
  if (viteConfigs.length > 0) {
    mergedConfig.viteConfig = viteConfigs.reduce((acc, cfg) => mergeConfig(acc, cfg), {} as UserConfig)
  }

  return mergedConfig
}
