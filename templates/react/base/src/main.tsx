/**
 * Application entry file - Standard mode
 * Initialize React application and mount to DOM
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { createRouter } from './router'
import { setupFeatures } from './main/index'

// Import styles
import '@/assets/styles/main.scss'
import '@/assets/fonts/index.css'

/**
 * Initialize and render application
 */
async function initApp(): Promise<void> {
  const router = createRouter()

  // Setup all features (i18n, sentry, etc.)
  await setupFeatures(router)

  const root = ReactDOM.createRoot(document.getElementById('root')!)

  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}

initApp()
