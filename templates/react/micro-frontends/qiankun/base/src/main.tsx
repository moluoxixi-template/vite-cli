/**
 * Application entry file - Qiankun micro-frontend mode
 * Initialize React application and mount to DOM (supports qiankun lifecycle)
 */

import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { createRouter } from '@/router'
import { setupFeatures } from './main/index'

// Import styles
import '@/assets/styles/main.scss'
import '@/assets/fonts/index.css'

let root: ReturnType<typeof ReactDOM.createRoot> | null = null

/**
 * Render application
 * @param props - Render props from qiankun
 */
async function render(props: Record<string, unknown> = {}): Promise<void> {
  const { container } = props as { container?: Element }

  const basename = qiankunWindow.__POWERED_BY_QIANKUN__
    ? (qiankunWindow as { __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string }).__INJECTED_PUBLIC_PATH_BY_QIANKUN__?.split('/')[1]
    : undefined
  const router = createRouter({ basename })

  // Setup all features (i18n, sentry, etc.)
  await setupFeatures(router)

  const containerElement = container
    ? container.querySelector('#root') || container
    : document.getElementById('root')!

  root = ReactDOM.createRoot(containerElement)
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
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
      console.log('[Qiankun] React app bootstrapped')
    },
    unmount() {
      root?.unmount()
      root = null
      console.log('[Qiankun] React app unmounted')
    },
    update() {
      console.log('[Qiankun] React app updated')
    },
  })
}
