import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { execa } from 'execa'
import fs from 'fs-extra'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import { generateProject } from '@/generators/project'
import type { FrameworkType, ProjectConfigType, RouteModeType } from '@/types'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

const require = createRequire(import.meta.url)
const ACTIVE_RULE = '/tenant/child'
const QIANKUN_ESM_ENTRY = require.resolve('qiankun/es/index.js')
const SINGLE_SPA_ESM_ENTRY = require.resolve('single-spa/lib/esm/single-spa.min.js')
const CASES: Array<{ framework: FrameworkType, routeMode: RouteModeType }> = [
  { framework: 'vue', routeMode: 'manualRoutes' },
  { framework: 'vue', routeMode: 'pageRoutes' },
  { framework: 'react', routeMode: 'manualRoutes' },
  { framework: 'react', routeMode: 'pageRoutes' },
]

describe.sequential('真实 qiankun host 生命周期', () => {
  for (const testCase of CASES) {
    it(`${testCase.framework} ${testCase.routeMode} 支持嵌套 activeRule、unmount 和 remount`, async () => {
      await verifyQiankunLifecycle(testCase.framework, testCase.routeMode)
    })
  }
})

async function verifyQiankunLifecycle(
  framework: FrameworkType,
  routeMode: RouteModeType,
): Promise<void> {
  let childDir: string | undefined
  let hostDir: string | undefined
  let childServer: ViteDevServer | undefined
  let hostServer: ViteDevServer | undefined
  let browser: Browser | undefined

  try {
    childDir = await createTempDir(`vite-cli-qiankun-${framework}-${routeMode}-`)
    hostDir = await createTempDir(`vite-cli-qiankun-host-${framework}-${routeMode}-`)
    browser = await chromium.launch({ headless: true })
    const config = createQiankunConfig(framework, routeMode, childDir)
    await generateProject(config)

    const install = await execa('pnpm', ['install', '--prefer-offline'], {
      cwd: childDir,
      reject: false,
    })
    expect(install.exitCode, install.stderr).toBe(0)

    childServer = await createGeneratedViteServer(childDir, framework)
    const childEntry = childServer.resolvedUrls?.local[0]
    if (!childEntry) {
      throw new Error('生成项目 Vite server 未提供访问地址')
    }

    await writeHostFiles(hostDir, childEntry, framework)
    hostServer = await createServer({
      root: hostDir,
      logLevel: 'silent',
      optimizeDeps: {
        force: true,
        include: ['qiankun', 'single-spa'],
      },
      resolve: {
        alias: {
          'qiankun': QIANKUN_ESM_ENTRY,
          'single-spa': SINGLE_SPA_ESM_ENTRY,
        },
      },
      server: {
        host: '127.0.0.1',
        port: 0,
      },
    })
    await hostServer.listen()
    await hostServer.warmupRequest('/src/main.ts')

    const hostUrl = hostServer.resolvedUrls?.local[0]
    if (!hostUrl) {
      throw new Error('qiankun host Vite server 未提供访问地址')
    }

    const page = await browser.newPage()
    const pageErrors: string[] = []
    const browserLogs: string[] = []
    const consoleErrors: string[] = []
    const networkErrors: string[] = []
    const responseDiagnostics: Array<Promise<void>> = []
    page.setDefaultTimeout(15_000)
    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('console', (message) => {
      const entry = `[console:${message.type()}] ${message.text()}`
      browserLogs.push(entry)
      if (message.type() === 'error') {
        consoleErrors.push(entry)
      }
    })
    page.on('requestfailed', (request) => {
      const entry = `[requestfailed] ${request.url()} ${request.failure()?.errorText || ''}`
      browserLogs.push(entry)
      networkErrors.push(entry)
    })
    page.on('response', (response) => {
      if (response.status() >= 400) {
        const entry = `[response:${response.status()}] ${response.url()}`
        browserLogs.push(entry)
        networkErrors.push(entry)
        responseDiagnostics.push(response.text()
          .then((body) => {
            browserLogs.push(`[response-body] ${body}`)
          })
          .catch((error) => {
            browserLogs.push(`[response-body-error] ${String(error)}`)
          }))
      }
    })

    const initialPath = framework === 'react' && routeMode === 'manualRoutes'
      ? ACTIVE_RULE
      : `${ACTIVE_RULE}/home`
    await page.goto(new URL(initialPath, hostUrl).href)
    try {
      await page.locator('#micro-container h1')
        .getByText(framework === 'vue' ? '欢迎使用 Vue Template' : '欢迎使用 React Template')
        .waitFor({ timeout: 30_000 })
    }
    catch (error) {
      await Promise.all(responseDiagnostics)
      throw new Error([
        error instanceof Error ? error.message : String(error),
        `childEntry=${childEntry}`,
        `childBase=${childServer.config.base}`,
        `childEnvDir=${childServer.config.envDir}`,
        ...pageErrors,
        ...browserLogs,
        await page.locator('#micro-container').innerHTML(),
      ].join('\n'))
    }
    expect(new URL(page.url()).pathname).toBe(initialPath)
    expect(await page.locator('body').getAttribute('data-mounts')).toBe('1')
    if (framework === 'vue') {
      expect(await page.locator('#micro-container .el-container').count()).toBeGreaterThan(0)
      expect(await page.locator('#micro-container .app-container').count()).toBe(0)
    }

    await navigateWithinHost(page, '/outside')
    expect(new URL(page.url()).pathname).toBe('/outside')
    try {
      await expect.poll(
        async () => page.locator('#micro-container').getAttribute('data-mounted'),
        { timeout: 10_000 },
      ).toBeNull()
    }
    catch (error) {
      throw new Error([
        error instanceof Error ? error.message : String(error),
        `url=${page.url()}`,
        ...pageErrors,
        ...browserLogs,
        await page.locator('#micro-container').innerHTML(),
      ].join('\n'))
    }
    expect(await page.locator('body').getAttribute('data-unmounts')).toBe('1')

    await navigateWithinHost(page, `${ACTIVE_RULE}/about`)
    await page.locator('#micro-container h1').getByText('关于').waitFor()
    expect(new URL(page.url()).pathname).toBe(`${ACTIVE_RULE}/about`)
    expect(await page.locator('body').getAttribute('data-mounts')).toBe('2')
    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
  }
  finally {
    await browser?.close()
    await hostServer?.close()
    await childServer?.close()
    if (hostDir) {
      await cleanupTempDir(hostDir)
    }
    if (childDir) {
      await cleanupTempDir(childDir)
    }
  }
}

function createQiankunConfig(
  framework: FrameworkType,
  routeMode: RouteModeType,
  targetDir: string,
): ProjectConfigType {
  return {
    projectName: `qiankun-${framework}`,
    description: 'Qiankun lifecycle validation',
    author: 'test',
    framework,
    uiLibrary: framework === 'vue' ? 'element-plus' : 'ant-design',
    routeMode,
    i18n: false,
    sentry: false,
    eslint: false,
    husky: false,
    microFrontend: true,
    microFrontendEngine: 'qiankun',
    packageManager: 'pnpm',
    targetDir,
  }
}

async function createGeneratedViteServer(
  projectDir: string,
  framework: FrameworkType,
): Promise<ViteDevServer> {
  const viteEntry = path.join(projectDir, 'node_modules', 'vite', 'dist', 'node', 'index.js')
  const generatedVite = await import(pathToFileURL(viteEntry).href) as {
    createServer: typeof createServer
  }
  const server = await generatedVite.createServer({
    root: projectDir,
    logLevel: 'error',
    server: {
      host: '127.0.0.1',
      port: 0,
    },
  })
  await server.listen()
  await server.warmupRequest(framework === 'vue' ? '/src/main.ts' : '/src/main.tsx')
  return server
}

async function writeHostFiles(
  hostDir: string,
  childEntry: string,
  framework: FrameworkType,
): Promise<void> {
  await fs.outputFile(path.join(hostDir, 'index.html'), `<!doctype html>
<html>
  <head><meta charset="UTF-8"><title>Qiankun host</title></head>
  <body data-mounts="0" data-unmounts="0">
    <div id="micro-container"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`)
  await fs.outputFile(path.join(hostDir, 'src', 'main.ts'), `import { registerMicroApps, start } from 'qiankun'
import { navigateToUrl, setBootstrapMaxTime } from 'single-spa'

window.navigateWithinHost = navigateToUrl

// Vite dev transforms are cold-started for every generated child. Keep the
// host's single-spa timeout explicit so a slow transform is not misreported as
// a lifecycle failure; console errors are still asserted below.
setBootstrapMaxTime(30_000, false)

registerMicroApps([
  {
    name: '${framework}-child',
    entry: '${childEntry}',
    container: '#micro-container',
    activeRule: '${ACTIVE_RULE}',
    props: { activeRule: '${ACTIVE_RULE}' },
  },
], {
  afterMount: [() => {
    document.body.dataset.mounts = String(Number(document.body.dataset.mounts || 0) + 1)
    document.querySelector('#micro-container')?.setAttribute('data-mounted', 'true')
  }],
  afterUnmount: [() => {
    document.body.dataset.unmounts = String(Number(document.body.dataset.unmounts || 0) + 1)
    document.querySelector('#micro-container')?.removeAttribute('data-mounted')
  }],
})

start({ prefetch: false, sandbox: false })
`)
}

async function navigateWithinHost(
  page: Page,
  pathname: string,
): Promise<void> {
  const targetUrl = new URL(pathname, page.url()).href
  await page.evaluate((nextUrl) => {
    const hostWindow = window as typeof window & {
      navigateWithinHost: (url: string) => void
    }
    hostWindow.navigateWithinHost(nextUrl)
  }, targetUrl)
}
