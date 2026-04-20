import type { App } from 'vue'
import type { Router } from 'vue-router'

/**
 * 应用上下文，未来可扩展 pinia 等
 */
export interface AppContext {
  app: App
  router: Router
  isClient?: boolean
}

/**
 * 模块安装接口 (Vitesse 风格)
 */
export type UserModule = (ctx: AppContext) => void | Promise<void>
