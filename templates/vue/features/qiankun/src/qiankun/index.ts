import type { App } from 'vue'
import type { Router } from 'vue-router'
import {
  renderWithQiankun,
  qiankunWindow,
} from 'vite-plugin-qiankun/dist/helper'

let app: App | null = null
let router: Router | null = null

interface QiankunProps {
  container?: Element
  [key: string]: unknown
}

interface RenderOptions {
  createApp: () => App
  createRouter: (qiankunName?: string) => Router
  mountApp: (app: App, router: Router, container: string | Element) => void
}

export function setupQiankun(options: RenderOptions): void {
  const { createApp, createRouter, mountApp } = options

  renderWithQiankun({
    mount(props: QiankunProps) {
      app = createApp()
      const qiankunName = qiankunWindow.__POWERED_BY_QIANKUN__
        ? (qiankunWindow as { __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string }).__INJECTED_PUBLIC_PATH_BY_QIANKUN__?.split('/')[1]
        : undefined
      router = createRouter(qiankunName)
      const container = props.container
        ? props.container.querySelector('#app')!
        : '#app'
      mountApp(app, router, container)
    },
    bootstrap() {
      console.log('[Qiankun] bootstrap')
    },
    unmount() {
      if (app) {
        app.unmount()
        app = null
        router = null
      }
    },
    update() {
      console.log('[Qiankun] update')
    },
  })
}

export function isQiankun(): boolean {
  return qiankunWindow.__POWERED_BY_QIANKUN__ || false
}

