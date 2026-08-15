import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { execa } from 'execa'
import { chromium } from 'playwright'
import type { Browser } from 'playwright'
import type { createServer, ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import { generateProject } from '@/generators/project'
import type { FrameworkType, ProjectConfigType, RouteModeType } from '@/types'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

const CASES: Array<{
  framework: FrameworkType
  routeMode: RouteModeType
  homePath: string
  homeHeading: string
}> = [
  { framework: 'vue', routeMode: 'manualRoutes', homePath: '/app/home', homeHeading: '欢迎使用 Vue Template' },
  { framework: 'vue', routeMode: 'pageRoutes', homePath: '/app/home', homeHeading: '欢迎使用 Vue Template' },
  { framework: 'react', routeMode: 'manualRoutes', homePath: '/app', homeHeading: '欢迎使用 React Template' },
  { framework: 'react', routeMode: 'pageRoutes', homePath: '/app/home', homeHeading: '欢迎使用 React Template' },
]

describe.sequential('standard 项目浏览器路由', () => {
  for (const testCase of CASES) {
    it(`${testCase.framework} ${testCase.routeMode} 可独立访问首页和 /app/about`, async () => {
      let projectDir: string | undefined
      let browser: Browser | undefined
      let server: ViteDevServer | undefined

      try {
        projectDir = await createTempDir(`vite-cli-browser-${testCase.framework}-`)
        browser = await chromium.launch({ headless: true })
        await generateProject(createConfig(testCase.framework, testCase.routeMode, projectDir))
        const install = await execa('pnpm', ['install', '--prefer-offline'], {
          cwd: projectDir,
          reject: false,
        })
        expect(install.exitCode, install.stderr).toBe(0)

        server = await createGeneratedViteServer(projectDir)
        expect(server.config.base).toBe('/app/')
        const serverUrl = server.resolvedUrls?.local[0]
        if (!serverUrl) {
          throw new Error('生成项目 Vite server 未提供访问地址')
        }

        const page = await browser.newPage()
        const pageErrors: string[] = []
        const networkErrors: string[] = []
        page.setDefaultTimeout(15_000)
        page.on('pageerror', error => pageErrors.push(error.message))
        page.on('requestfailed', request => networkErrors.push(
          `${request.url()} ${request.failure()?.errorText || ''}`,
        ))
        page.on('response', (response) => {
          if (response.status() >= 400) {
            networkErrors.push(`${response.status()} ${response.url()}`)
          }
        })

        await page.goto(new URL(testCase.homePath, serverUrl).href)
        await page.locator('h1').getByText(testCase.homeHeading).waitFor()
        if (testCase.framework === 'vue') {
          expect(await page.locator('.el-menu').count()).toBeGreaterThan(0)
          expect(await page.locator('.app-menu').count()).toBe(0)
        }

        await page.goto(new URL('/app/about', serverUrl).href)
        await page.locator('h1').getByText('关于').waitFor()
        expect(new URL(page.url()).pathname).toBe('/app/about')
        expect(pageErrors).toEqual([])
        expect(networkErrors).toEqual([])
      }
      finally {
        await browser?.close()
        await server?.close()
        if (projectDir) {
          await cleanupTempDir(projectDir)
        }
      }
    })
  }
})

function createConfig(
  framework: FrameworkType,
  routeMode: RouteModeType,
  targetDir: string,
): ProjectConfigType {
  return {
    projectName: `browser-${framework}-${routeMode}`,
    description: 'Standard browser validation',
    author: 'test',
    framework,
    uiLibrary: framework === 'vue' ? 'element-plus' : 'ant-design',
    routeMode,
    i18n: false,
    sentry: false,
    eslint: false,
    husky: false,
    microFrontend: false,
    packageManager: 'pnpm',
    targetDir,
  }
}

async function createGeneratedViteServer(projectDir: string): Promise<ViteDevServer> {
  const viteEntry = path.join(projectDir, 'node_modules', 'vite', 'dist', 'node', 'index.js')
  const generatedVite = await import(pathToFileURL(viteEntry).href) as {
    createServer: typeof createServer
  }
  const server = await generatedVite.createServer({
    root: projectDir,
    logLevel: 'silent',
    server: {
      host: '127.0.0.1',
      port: 0,
    },
  })
  await server.listen()
  return server
}
