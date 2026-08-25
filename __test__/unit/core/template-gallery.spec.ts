import { describe, expect, it } from 'vitest'
import { Buffer } from 'node:buffer'

import type { StackBlitzProjectPayload } from '@/core/templateGallery'
import {
  createStackBlitzStartCommand,
  parseStackBlitzProjectPayload,
} from '@/core/templateGallery'

describe('stackBlitz 项目载荷', () => {
  it('接受 pnpm 与 qiankun 独立预览运行契约', () => {
    expect(parseStackBlitzProjectPayload(createPayload())).toEqual(createPayload())
  })

  it('拒绝旧的 npm 运行契约', () => {
    const payload = createPayload()
    payload.files['package.json'] = JSON.stringify({
      packageManager: 'npm@10.9.0',
      scripts: { dev: 'vite' },
    })
    payload.files['.stackblitzrc'] = JSON.stringify({
      installDependencies: true,
      startCommand: 'npm run dev',
    })

    expect(() => parseStackBlitzProjectPayload(payload)).toThrow('StackBlitz 项目运行配置无效')
  })

  it('拒绝未启用独立预览的 qiankun 载荷', () => {
    const payload = createPayload()
    setInjectedEnvironment(payload, 'VITE_APP_CODE=\nVITE_APP_TITLE=Fixture\n')

    expect(() => parseStackBlitzProjectPayload(payload)).toThrow('StackBlitz qiankun 项目未启用独立预览')
  })

  it('拒绝依赖会被平台过滤的根 env', () => {
    const payload = createPayload()
    payload.files['.env'] = 'VITE_APP_CODE=\nVITE_APP_TITLE=Fixture\n'

    expect(() => parseStackBlitzProjectPayload(payload)).toThrow('StackBlitz 项目运行配置无效')
  })

  it('拒绝注入内容缺少通用变量', () => {
    const payload = createPayload()
    setInjectedEnvironment(payload, 'VITE_APP_CODE=\nVITE_STANDALONE=true\n')

    expect(() => parseStackBlitzProjectPayload(payload)).toThrow('StackBlitz 项目运行配置无效')
  })

  it('拒绝 WebContainer 无法执行的 sass-embedded', () => {
    const payload = createPayload()
    const packageJson = JSON.parse(payload.files['package.json'])
    packageJson.devDependencies['sass-embedded'] = '^1.87.0'
    payload.files['package.json'] = JSON.stringify(packageJson)

    expect(() => parseStackBlitzProjectPayload(payload)).toThrow('StackBlitz 项目运行配置无效')
  })

  it('拒绝把根 env 变量混入 mode env', () => {
    const payload = createPayload()
    payload.files['.env.development'] += 'VITE_APP_TITLE=Fixture\n'

    expect(() => parseStackBlitzProjectPayload(payload)).toThrow('StackBlitz 项目运行配置无效')
  })
})

function createPayload(): StackBlitzProjectPayload {
  return {
    title: 'qiankun fixture',
    description: 'StackBlitz fixture',
    template: 'node' as const,
    files: {
      '.env.development': 'VITE_APP_ENV=development\n',
      '.env.production': 'VITE_APP_ENV=production\n',
      '.stackblitzrc': JSON.stringify({
        installDependencies: false,
        startCommand: createStackBlitzStartCommand(Buffer.from(
          'VITE_APP_CODE=\nVITE_APP_TITLE=Fixture\nVITE_STANDALONE=true\n',
          'utf-8',
        ).toString('base64')),
      }),
      'package.json': JSON.stringify({
        packageManager: 'pnpm@10.8.0',
        scripts: { dev: 'vite' },
        devDependencies: { sass: '^1.87.0' },
      }),
      'vite.config.ts': 'import qiankun from \'vite-plugin-qiankun\'\n',
    },
  }
}

function setInjectedEnvironment(payload: StackBlitzProjectPayload, content: string): void {
  const config = JSON.parse(payload.files['.stackblitzrc'])
  config.startCommand = createStackBlitzStartCommand(
    Buffer.from(content, 'utf-8').toString('base64'),
  )
  payload.files['.stackblitzrc'] = JSON.stringify(config)
}
