/**
 * Application entry file - Standard mode
 * Initialize Vue application and mount to DOM
 */

import { createApp } from 'vue'
import directives from '@/directives'
import App from '@/App.vue'
import getRouter from '@/router'
import { setupFeatures } from '@/main/index'
import type { AppContext } from '@/types'

// Import styles
import '@/assets/styles/main.scss'
import '@/assets/fonts/index.css'

/**
 * Initialize and render application
 */
async function initApp(): Promise<void> {
  const app = createApp(App)
  const router = getRouter()

  directives(app)

  const ctx: AppContext = {
    app,
    router,
    isClient: typeof window !== 'undefined'
  }

  // Setup all features (pinia, i18n, sentry, etc.)
  await setupFeatures(ctx)

  app.use(router)
  app.config.warnHandler = () => null

  app.mount('#app')
}

initApp()
