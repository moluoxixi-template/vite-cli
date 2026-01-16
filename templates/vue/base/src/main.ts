/**
 * Application entry file - Standard mode
 * Initialize Vue application and mount to DOM
 */

import { createApp } from 'vue'
import directives from '@/directives'
import App from '@/App.vue'
import getRouter from '@/router'
import { setupFeatures } from '@/main'

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

  // Setup all features (pinia, i18n, sentry, etc.)
  await setupFeatures(app, router)

  app.use(router)
  app.config.warnHandler = () => null

  app.mount('#app')
}

initApp()
