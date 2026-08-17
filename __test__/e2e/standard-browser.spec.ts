import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { execa } from 'execa'
import fs from 'fs-extra'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
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
  deepPath: string
}> = [
  { framework: 'vue', routeMode: 'manualRoutes', homePath: '/app/home', homeHeading: '欢迎使用 Vue Template', deepPath: '/app/guide/advanced/topic' },
  { framework: 'vue', routeMode: 'pageRoutes', homePath: '/app/home', homeHeading: '欢迎使用 Vue Template', deepPath: '/app/guide/advanced/topic' },
  { framework: 'react', routeMode: 'manualRoutes', homePath: '/app', homeHeading: '欢迎使用 React Template', deepPath: '/app/guide/advanced/topic' },
  { framework: 'react', routeMode: 'pageRoutes', homePath: '/app/home', homeHeading: '欢迎使用 React Template', deepPath: '/app/guide/advanced/topic' },
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

        server = await createGeneratedViteServer(projectDir, testCase.framework)
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
        try {
          await page.locator('h1').getByText(testCase.homeHeading).waitFor({ timeout: 30_000 })
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
        if (testCase.framework === 'vue') {
          expect(await page.locator('.el-menu').count()).toBeGreaterThan(0)
          expect(await page.locator('.app-menu').count()).toBe(0)
          expect(await page.locator('.el-header').evaluate(element => getComputedStyle(element).padding)).toBe('0px')
        }
        else {
          expect(await page.locator('.ant-menu').count()).toBeGreaterThan(0)
          expect(await page.locator('.ant-layout-header').evaluate(element => getComputedStyle(element).padding)).toBe('0px')
        }

        await navigateThroughNestedMenu(page, testCase.framework)
        await page.locator('h3').getByText('三级标题').waitFor()
        expect(await page.getByText('三级标题', { exact: true }).count()).toBeGreaterThan(0)
        expect(new URL(page.url()).pathname).toBe(testCase.deepPath)
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

async function navigateThroughNestedMenu(page: Page, framework: FrameworkType): Promise<void> {
  const guideMenu = framework === 'react'
    ? page.locator('[role="menuitem"][aria-haspopup="true"]').filter({ hasText: '指南' }).first()
    : page.locator('ul[role="menubar"] > li[role="menuitem"]').filter({ hasText: '指南' }).first()
  await guideMenu.waitFor({ state: 'visible' })
  if (framework === 'vue') {
    expect(await guideMenu.locator('[role="menuitem"]').count()).toBeGreaterThan(0)
  }
  await guideMenu.hover()
  const advancedMenu = framework === 'react'
    ? page.locator('[role="menuitem"][aria-haspopup="true"]').filter({ hasText: '进阶' }).first()
    : guideMenu.locator('[role="menuitem"]').filter({ hasText: '进阶' }).first()
  await advancedMenu.waitFor({ state: 'visible' })
  if (framework === 'vue') {
    expect(await advancedMenu.locator('[role="menuitem"]').count()).toBeGreaterThan(0)
  }
  await advancedMenu.hover()
  const topicMenu = framework === 'react'
    ? page.locator('[role="menuitem"]:not([aria-haspopup])').filter({ hasText: '三级标题' }).first()
    : advancedMenu.locator('[role="menuitem"]').filter({ hasText: '三级标题' }).first()
  await topicMenu.waitFor({ state: 'visible' })
  await topicMenu.click()
}

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

async function createGeneratedViteServer(
  projectDir: string,
  framework: FrameworkType,
): Promise<ViteDevServer> {
  const resolvedProjectDir = await fs.realpath(projectDir)
  const viteEntry = path.join(resolvedProjectDir, 'node_modules', 'vite', 'dist', 'node', 'index.js')
  const generatedVite = await import(pathToFileURL(viteEntry).href) as {
    createServer: typeof createServer
  }
  const server = await generatedVite.createServer({
    root: resolvedProjectDir,
    logLevel: 'silent',
    server: {
      host: '127.0.0.1',
      port: 0,
      fs: {
        strict: false,
      },
    },
    watch: {
      usePolling: process.platform === 'win32',
    },
  })
  await server.listen()
  await server.warmupRequest(framework === 'vue' ? '/src/main.ts' : '/src/main.tsx')
  return server
}
