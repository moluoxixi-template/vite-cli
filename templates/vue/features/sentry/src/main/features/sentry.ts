/**
 * Sentry 错误监控 feature 设置
 */

import type { UserModule } from '@/types'
import { initSentry } from '@/utils/sentry'



/**
 * 设置 Sentry
 * @param ctx - Vue 应用上下文
 */
export const install: UserModule = ({ app, router }) => {
  initSentry(app, router, {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  })
}
