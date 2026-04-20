/**
 * Pinia 状态管理 feature 设置
 */

import type { UserModule } from '@/types'
import { store } from '@/stores'



/**
 * 设置 Pinia store
 * @param ctx - Vue 应用上下文
 */
export const install: UserModule = ({ app }) => {
  app.use(store)
}
