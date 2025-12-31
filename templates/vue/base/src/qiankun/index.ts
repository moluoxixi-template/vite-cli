/**
 * Qiankun 微前端配置
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'
import {
  qiankunWindow,
  renderWithQiankun,
} from 'vite-plugin-qiankun/dist/helper'

let app: App | null = null
let router: Router | null = null

/**
 * Qiankun 微前端 Props 接口
 */
interface QiankunProps {
  /** 容器元素（可选） */
  container?: Element
  /** 其他自定义属性 */
  [key: string]: unknown
}

/**
 * Qiankun 渲染选项接口
 */
interface RenderOptions {
  /** 创建 Vue 应用实例的函数 */
  createApp: () => App
  /** 创建 Vue Router 实例的函数 */
  createRouter: (qiankunName?: string) => Router
  /** 挂载应用实例的函数 */
  mountApp: (app: App, router: Router, container: string | Element) => void
}

/**
 * 设置 Qiankun 微前端
 * @param options 渲染选项
 */
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

/**
 * 判断是否运行在 Qiankun 微前端环境中
 * @returns 是否在 Qiankun 环境中
 */
export function isQiankun(): boolean {
  return qiankunWindow.__POWERED_BY_QIANKUN__ || false
}

