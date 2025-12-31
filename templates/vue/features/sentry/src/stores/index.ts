/**
 * Pinia Store 配置
 * 配置 Pinia 状态管理，集成持久化插件和 Sentry 监控插件
 */

import { createSentryPiniaPlugin } from '@sentry/vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const store = createPinia()
store.use(piniaPluginPersistedstate)
store.use(createSentryPiniaPlugin())
export { store }
