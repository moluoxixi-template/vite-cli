/**
 * Vite 配置渲染工具
 * 简化版：直接返回配置数据给 EJS 模板处理
 */

import type { ProjectConfigType } from '../types/index.ts'

/**
 * 生成 vite.config.ts 的 EJS 模板数据
 * @param config 项目配置对象
 * @returns EJS 模板数据对象，包含框架类型、Sentry 配置、UI 库和路由模式
 */
export function getViteConfigEjsData(config: ProjectConfigType): {
  framework: string
  sentry?: boolean
  uiLibrary?: string
  routeMode?: string
} {
  return {
    framework: config.framework,
    sentry: config.sentry,
    uiLibrary: config.uiLibrary,
    routeMode: config.routeMode,
  }
}
