/**
 * Vite 配置渲染工具
 * 基于路径映射钩子系统的配置聚合引擎
 * 从各 feature 的 vite.config.data.ts 中读取配置并聚合
 */

import type {
  ProjectConfigType,
  ViteConfigData,
} from '../types/index.ts'

import fs from 'node:fs'
import path from 'node:path'

import { createJiti } from 'jiti'

import { FILE_CONSTANTS } from '../constants/index.ts'

import { deepMerge } from './deepMerge.ts'
import { getRouteModeFeature, getUILibraryFeature } from './featureMapping.ts'
import { getTemplatesDir } from './file.ts'

/** Jiti 实例，用于动态加载 TypeScript 配置文件 */
const jiti = createJiti(import.meta.url)

/**
 * 占位符前缀，用于标识需要替换的函数位置
 */
const PLACEHOLDER_PREFIX = '__HOOK_PLACEHOLDER__'

/**
 * 从模板目录读取 vite.config.data.ts
 * @param framework 框架类型
 * @param feature 特性名称（'base' 表示框架基础模板，其他表示 feature）
 * @returns ViteConfigData 配置数据，如果文件不存在则返回 null
 * @throws {Error} 如果文件存在但加载失败
 */
function readViteConfigData(framework: string, feature: string): ViteConfigData | null {
  const templatesDir = getTemplatesDir()
  let dataPath: string

  if (feature === 'base') {
    // base 模板的 vite.config.data.ts 在框架 base 目录下
    dataPath = path.join(
      templatesDir,
      framework,
      'base',
      FILE_CONSTANTS.VITE_CONFIG_DATA,
    )
  }
  else {
    // feature 的 vite.config.data.ts 在 features 目录下
    dataPath = path.join(
      templatesDir,
      framework,
      'features',
      feature,
      FILE_CONSTANTS.VITE_CONFIG_DATA,
    )
  }

  if (!fs.existsSync(dataPath)) {
    return null
  }

  try {
    const module = jiti(dataPath) as { default: ViteConfigData }
    return module.default
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `无法加载 ${FILE_CONSTANTS.VITE_CONFIG_DATA}: ${dataPath}\n错误: ${errorMessage}`,
      { cause: error },
    )
  }
}

/**
 * 收集所有启用的 feature 的 vite.config.data
 * 包括 base 模板和所有启用的 features
 * @param config 项目配置
 * @returns ViteConfigData 数组
 * @throws {Error} 如果加载配置文件失败
 */
export function collectViteConfigData(config: ProjectConfigType): ViteConfigData[] {
  const framework = config.framework
  const dataList: ViteConfigData[] = []

  // 首先收集 base 模板的配置
  const baseData = readViteConfigData(framework, 'base')
  if (baseData) {
    dataList.push(baseData)
  }

  // 根据配置收集各 feature 的配置数据
  // 注意：只收集那些有 vite.config.data.ts 文件的 features
  const enabledFeatures: string[] = []

  // Sentry feature
  if (config.sentry) {
    enabledFeatures.push('sentry')
  }

  // 路由模式 feature（只有 file-system 模式有 vite.config.data.ts）
  if (config.routeMode === 'file-system') {
    const routeModeFeature = getRouteModeFeature(config.routeMode)
    enabledFeatures.push(routeModeFeature)
  }

  // UI 库 feature（只有 element-plus 有 vite.config.data.ts）
  if (framework === 'vue' && config.uiLibrary === 'element-plus') {
    const uiLibraryFeature = getUILibraryFeature(config.uiLibrary)
    enabledFeatures.push(uiLibraryFeature)
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
 * 在对象中设置嵌套路径的值
 * @param obj 目标对象
 * @param path 深度路径（如 'css.preprocessorOptions.scss.additionalData'）
 * @param value 要设置的值
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }

  current[keys[keys.length - 1]] = value
}

/**
 * 生成唯一占位符字符串
 * @param configPath 配置路径
 * @returns 唯一占位符字符串
 */
function generatePlaceholder(configPath: string): string {
  const hash = configPath.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0
  }, 0)
  return `${PLACEHOLDER_PREFIX}${Math.abs(hash).toString(36)}`
}

/**
 * 串联多个钩子函数片段
 * 通过变量接力的方式将多个片段聚合为单一的执行函数
 * @param hooks 钩子函数片段数组
 * @returns 串联后的函数代码字符串
 */
function chainHooks(hooks: string[]): string {
  if (hooks.length === 0) {
    return ''
  }

  if (hooks.length === 1) {
    return hooks[0].trim()
  }

  // 检测第一个 hook 的函数签名，判断是否为多参数函数
  const firstHook = hooks[0].trim()
  // 检查函数参数列表中是否包含逗号（表示多参数）
  const paramMatch = firstHook.match(/\(([^)]+)\)/)
  const isMultiParam = paramMatch ? paramMatch[1].includes(',') : false

  if (isMultiParam && paramMatch) {
    // 多参数函数串联（如 additionalData: (source, filename) => ...）
    const lines: string[] = []
    // 提取参数名
    const params = paramMatch[1].split(',').map(p => p.trim().split(':')[0].trim())
    const firstParam = params[0]
    const otherParams = params.slice(1)
    lines.push(`(${params.join(', ')}) => {`)
    lines.push(`  let result = ${firstParam};`)

    for (const hook of hooks) {
      const trimmedHook = hook.trim()
      // 串联时，第一个参数使用 result，其他参数保持原样
      const callParams = ['result', ...otherParams].join(', ')
      if (trimmedHook.startsWith('(') || trimmedHook.startsWith('function') || trimmedHook.startsWith('async')) {
        lines.push(`  result = ${trimmedHook}(${callParams});`)
      }
      else {
        lines.push(`  result = (${trimmedHook})(${callParams});`)
      }
    }

    lines.push('  return result;')
    lines.push('}')
    return lines.join('\n')
  }

  // 单参数函数串联：result = fn1(result); result = fn2(result); ...
  const lines: string[] = []
  lines.push('(result) => {')

  for (const hook of hooks) {
    const trimmedHook = hook.trim()
    // 如果钩子片段是一个函数表达式，直接调用
    if (trimmedHook.startsWith('(') || trimmedHook.startsWith('function') || trimmedHook.startsWith('async')) {
      lines.push(`  result = ${trimmedHook}(result);`)
    }
    else {
      // 假设是函数体片段，需要构造函数调用
      lines.push(`  result = (${trimmedHook})(result);`)
    }
  }

  lines.push('  return result;')
  lines.push('}')

  return lines.join('\n')
}

/**
 * 合并所有 Feature 的配置数据
 * 执行静态合并和钩子分拣
 * @param dataList ViteConfigData 数组
 * @returns 合并后的配置对象和钩子映射
 */
function mergeConfigData(dataList: ViteConfigData[]): {
  mergedConfig: Record<string, unknown>
  hooksMap: Map<string, string[]>
  imports: string[]
  plugins: string[]
  options: Record<string, unknown>
} {
  // 初始化合并结果
  const mergedConfig: Record<string, unknown> = {}
  const hooksMap = new Map<string, string[]>()
  const imports: string[] = []
  const plugins: string[] = []
  const options: Record<string, unknown> = {}

  // 收集所有 feature 的配置
  for (const data of dataList) {
    // 合并 imports（完整的导入语句）
    if (data.imports) {
      imports.push(...data.imports)
    }

    // 合并 plugins
    if (data.plugins) {
      plugins.push(...data.plugins)
    }

    // 深度合并 config（viteConfig 内部的配置）
    if (data.config) {
      deepMerge(mergedConfig, data.config)
    }

    // 合并 options（ViteConfig 顶层选项）
    if (data.options) {
      Object.assign(options, data.options)
    }

    // 收集 hooks，按 configPath 归类
    if (data.hooks) {
      for (const [configPath, hookCode] of Object.entries(data.hooks)) {
        if (!hooksMap.has(configPath)) {
          hooksMap.set(configPath, [])
        }
        hooksMap.get(configPath)!.push(hookCode)
      }
    }
  }

  return {
    mergedConfig,
    hooksMap,
    imports,
    plugins,
    options,
  }
}

/**
 * 在配置对象中设置占位符
 * @param config 配置对象
 * @param hooksMap 钩子映射
 * @returns 占位符到配置路径的映射
 */
function injectPlaceholders(
  config: Record<string, unknown>,
  hooksMap: Map<string, string[]>,
): Map<string, string> {
  const placeholderMap = new Map<string, string>()

  for (const [configPath] of hooksMap.entries()) {
    const placeholder = generatePlaceholder(configPath)
    placeholderMap.set(placeholder, configPath)

    // 在配置对象中设置占位符
    setNestedValue(config, configPath, placeholder)
  }

  return placeholderMap
}

/**
 * 生成导入语句字符串（用于 EJS 模板）
 * @param imports 导入语句字符串数组
 * @returns 导入语句字符串（多行）
 */
function generateImportsString(imports: string[]): string {
  return imports.join('\n')
}

/**
 * 判断字符串是否为代码字符串（需要直接输出，不加引号）
 * @param value 字符串值
 * @returns 是否为代码字符串
 */
function isCodeString(value: string): boolean {
  // 检查是否包含代码特征：操作符、类型断言、函数调用等
  return /(?:^|\s)(?:as\s+\w+|&&|\|\||=>|[([{])/.test(value)
}

/**
 * 处理占位符替换为串联函数
 * @param value 字符串值（可能是占位符）
 * @param placeholderMap 占位符到路径的映射
 * @param hooksMap 钩子映射
 * @returns 处理后的代码字符串，如果不是占位符则返回 null
 */
function processPlaceholder(
  value: string,
  placeholderMap: Map<string, string>,
  hooksMap: Map<string, string[]>,
): string | null {
  if (value.startsWith(PLACEHOLDER_PREFIX)) {
    const configPath = placeholderMap.get(value)
    if (configPath) {
      const hooks = hooksMap.get(configPath) || []
      const chainedHook = chainHooks(hooks)
      return chainedHook
    }
  }
  return null
}

/**
 * 序列化配置对象为代码字符串
 * 处理占位符替换
 * @param config 配置对象
 * @param placeholderMap 占位符到路径的映射
 * @param hooksMap 钩子映射
 * @param indent 缩进级别
 * @returns 配置代码字符串
 */
function serializeConfig(
  config: Record<string, unknown>,
  placeholderMap: Map<string, string>,
  hooksMap: Map<string, string[]>,
  indent = 0,
): string {
  const indentStr = '  '.repeat(indent)
  const lines: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (value === null || value === undefined) {
      continue
    }

    if (typeof value === 'string') {
      // 检查是否为占位符（hooks 注入点）
      const chainedHook = processPlaceholder(value, placeholderMap, hooksMap)
      if (chainedHook) {
        lines.push(`${indentStr}${key}: ${chainedHook},`)
      }
      else {
        // config 中只包含纯 JSON 数据，所有字符串都应该被序列化
        lines.push(`${indentStr}${key}: ${JSON.stringify(value)},`)
      }
    }
    else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${indentStr}${key}: ${value},`)
    }
    else if (Array.isArray(value)) {
      lines.push(`${indentStr}${key}: [`)
      for (const item of value) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const nested = serializeConfig(item as Record<string, unknown>, placeholderMap, hooksMap, indent + 1)
          if (nested.trim()) {
            lines.push(nested)
          }
        }
        else if (typeof item === 'string') {
          // 检查是否为占位符
          const chainedHook = processPlaceholder(item, placeholderMap, hooksMap)
          if (chainedHook) {
            lines.push(`${indentStr}  ${chainedHook},`)
          }
          else if (isCodeString(item)) {
            // 代码字符串直接输出，不加引号
            lines.push(`${indentStr}  ${item},`)
          }
          else {
            // config 中只包含纯 JSON 数据，所有字符串都应该被序列化
            lines.push(`${indentStr}  ${JSON.stringify(item)},`)
          }
        }
        else {
          lines.push(`${indentStr}  ${JSON.stringify(item)},`)
        }
      }
      lines.push(`${indentStr}],`)
    }
    else if (typeof value === 'object') {
      lines.push(`${indentStr}${key}: {`)
      const nested = serializeConfig(value as Record<string, unknown>, placeholderMap, hooksMap, indent + 1)
      if (nested.trim()) {
        lines.push(nested)
      }
      lines.push(`${indentStr}},`)
    }
  }

  return lines.join('\n')
}

/**
 * 生成顶层配置字符串
 * @param options 从 vite.config.data.ts 中收集并合并的 options
 * @returns 顶层配置字符串
 */
function generateTopLevelConfig(options: Record<string, unknown>): string {
  const lines: string[] = []

  // 直接序列化所有 options 配置
  for (const [key, value] of Object.entries(options)) {
    if (typeof value === 'boolean') {
      lines.push(`${key}: ${value},`)
    }
    else if (typeof value === 'string') {
      lines.push(`${key}: ${JSON.stringify(value)},`)
    }
    else if (typeof value === 'number') {
      lines.push(`${key}: ${value},`)
    }
  }

  return lines.join('\n      ')
}

/**
 * 生成 vite.config.ts 的 EJS 模板数据
 * @param config 项目配置
 * @returns EJS 模板数据对象
 * @throws {Error} 如果收集配置数据失败
 */
export function getViteConfigEjsData(config: ProjectConfigType): {
  imports: string
  plugins: string[]
  mergedConfigBody: string
  topLevelConfig: string
} {
  const dataList = collectViteConfigData(config)
  const { mergedConfig, hooksMap, imports, plugins, options } = mergeConfigData(dataList)

  // 直接使用合并后的配置（base 配置已经在 collectViteConfigData 中收集并合并）
  const finalViteConfig = mergedConfig

  // 注入占位符（在合并后的配置中）
  const placeholderMap = injectPlaceholders(finalViteConfig, hooksMap)

  // 序列化配置体（只序列化 viteConfig 部分，不包含顶层配置）
  const mergedConfigBody = serializeConfig(finalViteConfig, placeholderMap, hooksMap, 4)

  // 生成导入语句字符串
  const importsString = generateImportsString(imports)

  // 生成顶层配置
  const topLevelConfig = generateTopLevelConfig(options)

  return {
    imports: importsString,
    plugins,
    mergedConfigBody,
    topLevelConfig,
  }
}
