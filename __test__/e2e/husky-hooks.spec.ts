import path from 'node:path'

import { execa } from 'execa'
import fs from 'fs-extra'
import { describe, expect, it } from 'vitest'

import { generateProject } from '@/generators/project'
import type { ProjectConfigType } from '@/types'
import { cleanupTempDir, createTempDir } from '@test/test-utils'

describe.sequential('生成项目 Husky hooks', () => {
  for (const eslint of [false, true]) {
    it(`React standard 在 ESLint ${eslint ? '开启' : '关闭'}时可完成真实提交`, async () => {
      const projectDir = await createTempDir(`vite-cli-husky-eslint-${eslint ? 'on' : 'off'}-`)

      try {
        await generateProject(createConfig(projectDir, eslint))
        await runChecked('git', ['init', '--initial-branch=main'], projectDir)
        await runChecked('git', ['config', 'user.email', 'vite-cli@example.com'], projectDir)
        await runChecked('git', ['config', 'user.name', 'Vite CLI Test'], projectDir)
        await runChecked('pnpm', ['install', '--prefer-offline'], projectDir, {
          CI: 'false',
          HUSKY: '1',
        })

        expect(await readGitConfig(projectDir, 'core.hooksPath')).toBe('.husky/_')

        const appEntry = path.join(projectDir, 'src', 'App.tsx')
        await fs.appendFile(appEntry, '\n// Husky integration probe.\n')
        await runChecked('git', ['add', 'src/App.tsx'], projectDir)
        await runChecked('git', ['commit', '-m', 'test: verify generated hooks'], projectDir)

        const commitCount = await runChecked('git', ['rev-list', '--count', 'HEAD'], projectDir)
        expect(commitCount.stdout.trim()).toBe('1')
      }
      finally {
        await cleanupTempDir(projectDir)
      }
    })
  }
})

function createConfig(targetDir: string, eslint: boolean): ProjectConfigType {
  return {
    projectName: `husky-eslint-${eslint ? 'on' : 'off'}`,
    description: 'Husky integration validation',
    author: 'test',
    framework: 'react',
    uiLibrary: 'ant-design',
    routeMode: 'manualRoutes',
    i18n: false,
    sentry: false,
    eslint,
    husky: true,
    microFrontend: false,
    packageManager: 'pnpm',
    targetDir,
  }
}

async function readGitConfig(cwd: string, key: string): Promise<string> {
  const result = await runChecked('git', ['config', '--get', key], cwd)
  return result.stdout.trim()
}

async function runChecked(
  command: string,
  args: string[],
  cwd: string,
  env?: Record<string, string>,
) {
  const result = await execa(command, args, {
    cwd,
    reject: false,
    env: {
      ...process.env,
      ...env,
    },
  })

  expect(
    result.exitCode,
    `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`,
  ).toBe(0)
  return result
}
