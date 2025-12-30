import type { ReactNode } from 'react'
import type { Router } from '@remix-run/router'
import {
  qiankunWindow,
  renderWithQiankun,
} from 'vite-plugin-qiankun/dist/helper'

let root: ReturnType<typeof import('react-dom/client').createRoot> | null = null
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
  /** 创建 React 根节点的函数 */
  createRoot: (container: Element | DocumentFragment) => ReturnType<typeof import('react-dom/client').createRoot>
  /** 创建 React Router 实例的函数 */
  createRouter: (basename?: string) => Router
  /** 创建应用组件的函数 */
  createApp: (router: Router) => ReactNode
  /** 容器选择器或元素 */
  container?: string | Element
}

/**
 * 设置 Qiankun 微前端
 * @param options 渲染选项
 */
export function setupQiankun(options: RenderOptions): void {
  const { createRoot, createRouter, createApp, container = '#root' } = options

  renderWithQiankun({
    mount(props: QiankunProps) {
      const containerElement = props.container
        ? props.container.querySelector('#root') || props.container
        : typeof container === 'string'
          ? document.querySelector(container)!
          : container

      root = createRoot(containerElement)
      const basename = qiankunWindow.__POWERED_BY_QIANKUN__
        ? (qiankunWindow as { __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string }).__INJECTED_PUBLIC_PATH_BY_QIANKUN__?.split('/')[1]
        : undefined
      router = createRouter(basename)
      root.render(createApp(router))
    },
    bootstrap() {
      console.log('[Qiankun] bootstrap')
    },
    unmount() {
      if (root) {
        root.unmount()
        root = null
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
