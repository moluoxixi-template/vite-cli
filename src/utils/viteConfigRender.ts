/**
 * Vite 配置渲染工具
 * 参考 create-vue 的数据驱动方式
 * 从各 feature 的 vite.config.data.ts 中读取配置
 */

import type { ProjectConfigType, ViteConfigData } from '../types'

import fs from 'node:fs'
import path from 'node:path'

import { createJiti } from 'jiti'

import { getTemplatesDir } from './file'

/** Jiti 实例，用于动态加载 TypeScript 配置文件 */
const jiti = createJiti(import.meta.url)

/**
 * 从 feature 目录读取 vite.config.data.ts
 */
function readViteConfigData(framework: string, feature: string): ViteConfigData | null {
  const templatesDir = getTemplatesDir()
  const dataPath = path.join(templatesDir, framework, 'features', feature, 'vite.config.data.ts')

  if (!fs.existsSync(dataPath)) {
    return null
  }

  try {
    const module = jiti(dataPath) as { default: ViteConfigData }
    return module.default
  }
  catch (error) {
    console.error(`Failed to load ${dataPath}:`, error)
    return null
  }
}

/**
 * 收集所有启用的 feature 的 vite.config.data
 */
export function collectViteConfigData(config: ProjectConfigType): ViteConfigData[] {
  const framework = config.framework
  const dataList: ViteConfigData[] = []

  // 根据配置收集各 feature 的配置数据
  const enabledFeatures: string[] = []

  if (config.sentry) {
    enabledFeatures.push('sentry')
  }

  if (config.routeMode === 'file-system') {
    enabledFeatures.push('pageRoutes')
  }

  if (framework === 'vue' && config.uiLibrary === 'element-plus') {
    enabledFeatures.push('element-plus')
  }

  for (const feature of enabledFeatures) {
    const data = readViteConfigData(framework, feature)
    if (data) {
      dataList.push(data)
    }
  }

  return dataList
}

/**
 * 合并 ViteConfigData 数组
 */
export function mergeViteConfigData(dataList: ViteConfigData[]): ViteConfigData {
  const merged: ViteConfigData = {
    imports: [],
    options: {},
    plugins: [],
  }

  for (const data of dataList) {
    if (data.imports) {
      merged.imports!.push(...data.imports)
    }
    if (data.options) {
      Object.assign(merged.options!, data.options)
    }
    if (data.plugins) {
      merged.plugins!.push(...data.plugins)
    }
    if (data.css) {
      merged.css = data.css
    }
  }

  return merged
}

/**
 * 生成 vite.config.ts 内容
 */
export function renderViteConfig(config: ProjectConfigType): string {
  const dataList = collectViteConfigData(config)
  const merged = mergeViteConfigData(dataList)

  const lines: string[] = []

  lines.push('/**')
  lines.push(' * Vite 配置文件')
  lines.push(' * 基于 @moluoxixi/vite-config 的配置')
  lines.push(' */')
  lines.push('')
  lines.push('import path from \'node:path\'')
  lines.push('import process from \'node:process\'')
  lines.push('import cssModuleGlobalRootPlugin from \'@moluoxixi/css-module-global-root-plugin\'')
  lines.push('import { ViteConfig, wrapperEnv } from \'@moluoxixi/vite-config\'')

  // 添加 feature 导入
  if (merged.imports && merged.imports.length > 0) {
    for (const imp of merged.imports) {
      lines.push(imp)
    }
  }

  lines.push('import { loadEnv } from \'vite\'')
  lines.push('')
  lines.push('export default ViteConfig(')
  lines.push('  ({ mode }) => {')
  lines.push('    const env = loadEnv(mode!, process.cwd())')
  lines.push('    const viteEnv = wrapperEnv(env)')
  lines.push('    const rootPath = path.resolve()')
  lines.push('    const appCode = viteEnv.VITE_APP_CODE')
  lines.push('    const appTitle = viteEnv.VITE_APP_TITLE')
  lines.push('    const port = viteEnv.VITE_APP_PORT')
  lines.push('    return {')
  lines.push('      rootPath,')
  lines.push('      appTitle,')
  lines.push('      appCode,')
  lines.push('      port,')

  // 框架配置
  if (config.framework === 'vue') {
    lines.push('      vue: true,')
  }
  else {
    lines.push('      react: true,')
  }

  lines.push('      autoComponent: true,')

  // 添加 feature options
  if (merged.options) {
    for (const [key, value] of Object.entries(merged.options)) {
      if (typeof value === 'boolean') {
        lines.push(`      ${key}: ${value},`)
      }
      else if (typeof value === 'string') {
        lines.push(`      ${key}: '${value}',`)
      }
      else {
        lines.push(`      ${key}: ${JSON.stringify(value)},`)
      }
    }
  }

  lines.push('      viteConfig: {')
  lines.push('        plugins: [')

  // 添加 feature plugins
  if (merged.plugins && merged.plugins.length > 0) {
    for (const plugin of merged.plugins) {
      lines.push(`          ${plugin},`)
    }
  }

  lines.push('        ],')
  lines.push('        server: {')
  lines.push('          proxy: {')
  lines.push('            \'/api\': {')
  lines.push('              changeOrigin: true,')
  lines.push('              target: \'http://localhost:3000\',')
  lines.push('            },')
  lines.push('          },')
  lines.push('        },')
  lines.push('        css: {')
  lines.push('          postcss: {')
  lines.push('            plugins: [')
  lines.push('              cssModuleGlobalRootPlugin,')
  lines.push('            ],')
  lines.push('          },')
  lines.push('          preprocessorOptions: {')
  lines.push('            scss: {')
  lines.push('              silenceDeprecations: [\'legacy-js-api\'],')
  lines.push('              api: \'modern-compiler\',')

  // 添加 CSS additionalData
  if (merged.css?.additionalData) {
    lines.push(`              ${merged.css.additionalData}`)
  }

  lines.push('            },')
  lines.push('          },')
  lines.push('        },')
  lines.push('      },')
  lines.push('    }')
  lines.push('  },')
  lines.push(')')
  lines.push('')

  return lines.join('\n')
}
