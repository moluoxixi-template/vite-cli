/**
 * I18n 国际化 feature 设置
 */

import type { UserModule } from '@/types'
import i18n from '@/locales'



/**
 * 设置 i18n
 * @param ctx - Vue 应用上下文
 */
export const install: UserModule = ({ app }) => {
  app.use(i18n)
}
