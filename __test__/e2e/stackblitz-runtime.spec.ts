import { createServer as createNetServer } from 'node:net'
import path from 'node:path'
import process from 'node:process'

import { execa } from 'execa'
import fs from 'fs-extra'
import { chromium } from 'playwright'
import type { Browser } from 'playwright'
import { describe, expect, it } from 'vitest'

import { parseStackBlitzProjectPayload } from '@/core/templateGallery'
import { createStackBlitzProject } from '@/core/templateSource'
import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

describe.sequential('stackBlitz 载荷运行契约', () => {
  it.skipIf(process.platform === 'win32')('从文本载荷重新创建的项目可在根路径运行', async () => {
    const generatedDir = await createTempDir('vite-cli-stackblitz-source-')
    const payloadDir = await createTempDir('vite-cli-stackblitz-payload-')
    let browser: Browser | undefined
    let devServer: ReturnType<typeof execa> | undefined

    try {
      const config = createConfig(generatedDir)
      await generateProject(config)
      const payload = parseStackBlitzProjectPayload(
        await createStackBlitzProject(generatedDir, config),
      )
      await materializePayload(payload.files, payloadDir)

      const install = await execa('npm', ['install', '--prefer-online', '--no-audit', '--no-fund'], {
        cwd: payloadDir,
        reject: false,
      })
      expect(install.exitCode, `${install.stdout}\n${install.stderr}`).toBe(0)

      const port = await getAvailablePort()
      const serverUrl = `http://127.0.0.1:${port}/`
      devServer = execa('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
        cwd: payloadDir,
        detached: process.platform !== 'win32',
        reject: false,
      })
      await waitForHttpReady(serverUrl, devServer)

      browser = await chromium.launch({ headless: true })
      const page = await browser.newPage()
      const pageErrors: string[] = []
      const networkErrors: string[] = []
      page.on('pageerror', error => pageErrors.push(error.message))
      page.on('requestfailed', request => networkErrors.push(
        `${request.url()} ${request.failure()?.errorText || ''}`,
      ))
      page.on('response', (response) => {
        if (response.status() >= 400) {
          networkErrors.push(`${response.status()} ${response.url()}`)
        }
      })
      await page.goto(serverUrl)
      try {
        await page.locator('[role="menubar"]').waitFor({ timeout: 30_000 })
        await page.locator('h1, h2, h3').first().waitFor({ timeout: 30_000 })
      }
      catch (error) {
        throw new Error([
          error instanceof Error ? error.message : String(error),
          `url=${page.url()}`,
          ...pageErrors,
          ...networkErrors,
          await page.content(),
        ].join('\n'))
      }

      expect(new URL(page.url()).pathname.startsWith('/app')).toBe(false)
      expect(pageErrors).toEqual([])
      expect(networkErrors).toEqual([])
    }
    finally {
      await browser?.close()
      await terminateProcessTree(devServer)
      await cleanupTempDir(payloadDir)
      await cleanupTempDir(generatedDir)
    }
  }, 0)
})

function createConfig(targetDir: string): ProjectConfigType {
  return {
    projectName: 'stackblitz-runtime',
    description: 'StackBlitz runtime validation',
    author: 'test',
    framework: 'vue',
    uiLibrary: 'element-plus',
    routeMode: 'pageRoutes',
    i18n: false,
    sentry: false,
    eslint: false,
    husky: false,
    microFrontend: false,
    packageManager: 'pnpm',
    targetDir,
  }
}

async function materializePayload(files: Record<string, string>, targetDir: string): Promise<void> {
  for (const [relativePath, content] of Object.entries(files)) {
    await fs.outputFile(path.join(targetDir, ...relativePath.split('/')), content)
  }
}

async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createNetServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('无法分配 StackBlitz 测试端口'))
        return
      }
      server.close(error => error ? reject(error) : resolve(address.port))
    })
  })
}

async function waitForHttpReady(
  url: string,
  processHandle: ReturnType<typeof execa>,
): Promise<void> {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      const result = await processHandle
      throw new Error(`StackBlitz dev server 提前退出\n${result.stdout}\n${result.stderr}`)
    }
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    }
    catch {
      // Vite 仍在启动。
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error(`StackBlitz dev server 启动超时: ${url}`)
}

async function terminateProcessTree(processHandle?: ReturnType<typeof execa>): Promise<void> {
  if (!processHandle || processHandle.exitCode !== null) {
    return
  }
  if (process.platform === 'win32' && processHandle.pid) {
    await execa('taskkill', ['/pid', String(processHandle.pid), '/t', '/f'], { reject: false })
  }
  else if (processHandle.pid) {
    killProcessGroup(processHandle.pid, 'SIGTERM')
    if (!await waitForProcessExit(processHandle, 5_000)) {
      killProcessGroup(processHandle.pid, 'SIGKILL')
    }
  }
  await processHandle
}

function killProcessGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') {
      throw error
    }
  }
}

async function waitForProcessExit(
  processHandle: ReturnType<typeof execa>,
  timeoutMs: number,
): Promise<boolean> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      processHandle.then(() => true),
      new Promise<boolean>((resolve) => {
        timeout = setTimeout(resolve, timeoutMs, false)
      }),
    ])
  }
  finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}
