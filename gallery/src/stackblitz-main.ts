import sdk from '@stackblitz/sdk'

import { parseStackBlitzProjectPayload } from '@cli/core/templateGallery'
import './launch.css'

const statusElement = document.querySelector<HTMLElement>('#launch-status')

void openProject()

async function openProject(): Promise<void> {
  try {
    const params = new URLSearchParams(window.location.search)
    const projectPath = params.get('project')
    if (!projectPath || projectPath.includes('..')) {
      throw new TypeError('缺少有效的 StackBlitz 项目地址')
    }

    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
    const projectUrl = new URL(projectPath, baseUrl)
    if (projectUrl.origin !== window.location.origin
      || !projectUrl.pathname.startsWith(`${baseUrl.pathname}stackblitz/`)) {
      throw new TypeError('StackBlitz 项目地址不属于当前展厅')
    }

    const response = await fetch(projectUrl)
    if (!response.ok) {
      throw new Error(`源码加载失败: HTTP ${response.status}`)
    }
    const project = parseStackBlitzProjectPayload(await response.json())
    setStatus('正在启动 WebContainer...')
    await sdk.openProject(project, {
      newWindow: false,
      openFile: params.get('openFile') || undefined,
      view: 'default',
    })
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true)
  }
}

function setStatus(message: string, isError = false): void {
  if (statusElement) {
    statusElement.textContent = message
    statusElement.dataset.error = String(isError)
  }
}
