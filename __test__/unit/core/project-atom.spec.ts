/**
 * 项目输出 atom 测试
 * 验证 main 和 vite.config 的生成贡献来自各模板目录自己的 atom.mjs。
 */

import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import fs from 'fs-extra'
import {
  composeProjectOutput,
  loadProjectAtoms,
} from '@/core/projectAtom'

let tempDir: string

/**
 * 写入测试用 atom.mjs。
 * @param relativeDir atom 所在的临时相对目录
 * @param content atom.mjs 的模块内容
 * @returns atom 所在目录绝对路径
 */
async function writeAtom(relativeDir: string, content: string): Promise<string> {
  const atomDir = path.join(tempDir, relativeDir)
  await fs.ensureDir(atomDir)
  await fs.writeFile(path.join(atomDir, 'atom.mjs'), content)
  return atomDir
}

afterEach(async () => {
  if (tempDir && await fs.pathExists(tempDir)) {
    await fs.remove(tempDir)
  }
})

describe('项目输出 atom', () => {
  it('应该按模板目录顺序读取并合并 main/vite 贡献', async () => {
    tempDir = path.join(process.cwd(), '__test__', 'temp-atom-test', `atoms-${Date.now()}`)

    const baseDir = await writeAtom('vue/base', `
      export default {
        id: 'vue:base',
        main: {
          mode: 'vue-standard',
          imports: ["import { createApp } from 'vue'"],
          setup: ['const app = createApp(App)'],
        },
        vite: {
          imports: ["import vue from '@vitejs/plugin-vue'"],
          plugins: ['plugins.push(vue())'],
        },
      }
    `)
    const piniaDir = await writeAtom('vue/features/pinia', `
      export default {
        id: 'vue:pinia',
        main: {
          imports: ["import { store } from '@/stores'"],
          setup: ['app.use(store)'],
        },
      }
    `)
    const pageRoutesDir = await writeAtom('vue/features/pageRoutes', `
      export default {
        id: 'vue:pageRoutes',
        vite: {
          imports: ["import Pages from 'vite-plugin-pages'"],
          plugins: ["plugins.push(Pages({ dirs: 'src/pages' }))"],
        },
      }
    `)

    const atoms = await loadProjectAtoms([baseDir, piniaDir, pageRoutesDir])
    const output = composeProjectOutput(atoms)

    expect(output.atomIds).toEqual(['vue:base', 'vue:pinia', 'vue:pageRoutes'])
    expect(output.main.mode).toBe('vue-standard')
    expect(output.main.imports).toEqual([
      'import { createApp } from \'vue\'',
      'import { store } from \'@/stores\'',
    ])
    expect(output.main.setup).toEqual([
      'const app = createApp(App)',
      'app.use(store)',
    ])
    expect(output.vite.imports).toEqual([
      'import vue from \'@vitejs/plugin-vue\'',
      'import Pages from \'vite-plugin-pages\'',
    ])
    expect(output.vite.plugins).toEqual([
      'plugins.push(vue())',
      'plugins.push(Pages({ dirs: \'src/pages\' }))',
    ])
  })

  it('应该允许微前端 atom 覆盖 React 入口模式', () => {
    const output = composeProjectOutput([
      {
        id: 'react:base',
        main: { mode: 'react-standard' },
        vite: {
          pluginsByMainMode: {
            'react-standard': ['plugins.push(react())'],
            'react-qiankun': ['if (mode !== \'development\') plugins.push(react())'],
          },
        },
      },
      { id: 'react:qiankun', main: { mode: 'react-qiankun' } },
    ])

    expect(output.main.mode).toBe('react-qiankun')
    expect(output.vite.pluginsByMainMode['react-standard']).toEqual(['plugins.push(react())'])
    expect(output.vite.pluginsByMainMode['react-qiankun']).toEqual([
      'if (mode !== \'development\') plugins.push(react())',
    ])
  })
})
