/**
 * Application entry file - Qiankun micro-frontend mode
 * Initialize Vue application and mount to DOM (supports qiankun lifecycle)
 */

import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import { createApp } from 'vue'
import directives from './directives'
import { store } from './stores'
import App from './App.vue'
import getRouter from './router'
import { setupFeatures } from './main'

// Import styles
import './assets/styles/main.scss'
import './assets/fonts/index.css'

let app: ReturnType<typeof createApp> | null = null

/**
 * Render application
 * @param props - Render props from qiankun
 */
async function render(props: Record<string, unknown> = {}): Promise<void> {
  const { container } = props as { container?: Element }
  app = createApp(App)

  directives(app)
  const router = getRouter(props)

  // Setup all features (i18n, sentry, etc.)
  await setupFeatures(app, router)

  app.use(store)
  app.use(router)
  app.config.warnHandler = () => null

  if (container) {
    const root = container.querySelector('#app')
    app.mount(root)
  }
  else {
    app.mount('#app')
  }
}

// Qiankun lifecycle
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  // Standalone mode
  render({})
}
else {
  // Micro-frontend mode
  renderWithQiankun({
    async mount(props: Record<string, unknown>) {
      await render(props)
    },
    bootstrap() {
      console.log('[Qiankun] Vue app bootstrapped')
    },
    unmount() {
      app?.unmount()
      app = null
      console.log('[Qiankun] Vue app unmounted')
    },
    update() {
      console.log('[Qiankun] Vue app updated')
    },
  })
}
