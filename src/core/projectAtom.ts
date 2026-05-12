/**
 * 项目输出 atom 模块
 * 读取模板目录中的 atom.mjs，并合并 main 与 vite.config 的生成贡献。
 */

import fs from 'fs-extra'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const PROJECT_ATOM_FILE = 'atom.mjs'

export type MainRenderMode = 'vue-standard' | 'vue-qiankun'

export interface ProjectAtomMainContribution {
  mode?: MainRenderMode
  imports?: string[]
  appSetup?: string[]
  appUses?: string[]
  afterAppUses?: string[]
  setup?: string[]
  afterSetup?: string[]
}

export interface ProjectAtomViteContribution {
  imports?: string[]
  plugins?: string[]
  scssOptions?: string[]
}

export interface ProjectAtom {
  id: string
  main?: ProjectAtomMainContribution
  vite?: ProjectAtomViteContribution
}

export interface ProjectOutputComposition {
  atomIds: string[]
  main: Required<ProjectAtomMainContribution>
  vite: Required<ProjectAtomViteContribution>
}

/**
 * 读取多个模板目录中的 atom.mjs。
 * @param templateDirs 按模板渲染顺序排列的模板目录
 * @returns 解析后的 atom 列表
 * @throws {TypeError} 当 atom.mjs 默认导出结构非法
 */
export async function loadProjectAtoms(templateDirs: string[]): Promise<ProjectAtom[]> {
  const atoms: ProjectAtom[] = []

  for (const templateDir of templateDirs) {
    const atomPath = path.join(templateDir, PROJECT_ATOM_FILE)
    if (!fs.existsSync(atomPath)) {
      continue
    }

    const atomModule = await import(pathToFileURL(atomPath).href)
    const atom = atomModule.default as ProjectAtom | undefined
    assertProjectAtom(atom, atomPath)
    atoms.push(atom)
  }

  return atoms
}

/**
 * 合并项目输出 atom。
 * @param atoms 按模板渲染顺序排列的 atom 列表
 * @returns 可供 main/vite 渲染器消费的组合结果
 */
export function composeProjectOutput(atoms: ProjectAtom[]): ProjectOutputComposition {
  const output: ProjectOutputComposition = {
    atomIds: [],
    main: createEmptyMainContribution(),
    vite: createEmptyViteContribution(),
  }
  const seenAtomIds = new Set<string>()

  for (const atom of atoms) {
    if (seenAtomIds.has(atom.id)) {
      continue
    }
    seenAtomIds.add(atom.id)
    output.atomIds.push(atom.id)
    mergeMainContribution(output.main, atom.main)
    mergeViteContribution(output.vite, atom.vite)
  }

  return output
}

/**
 * 创建空 main 贡献对象。
 * @returns 带默认模式和空数组的 main 贡献
 */
function createEmptyMainContribution(): Required<ProjectAtomMainContribution> {
  return {
    mode: 'vue-standard',
    imports: [],
    appSetup: [],
    appUses: [],
    afterAppUses: [],
    setup: [],
    afterSetup: [],
  }
}

/**
 * 创建空 Vite 贡献对象。
 * @returns 带空数组的 Vite 贡献
 */
function createEmptyViteContribution(): Required<ProjectAtomViteContribution> {
  return {
    imports: [],
    plugins: [],
    scssOptions: [],
  }
}

/**
 * 校验 atom 默认导出结构。
 * @param atom atom 默认导出值
 * @param atomPath atom 文件路径，用于错误定位
 * @throws {TypeError} 当 atom 不是对象或缺少 id
 */
function assertProjectAtom(atom: ProjectAtom | undefined, atomPath: string): asserts atom is ProjectAtom {
  if (!atom || typeof atom !== 'object') {
    throw new TypeError(`atom.mjs 必须默认导出对象: ${atomPath}`)
  }
  if (!atom.id || typeof atom.id !== 'string') {
    throw new TypeError(`atom.mjs 缺少字符串 id: ${atomPath}`)
  }
}

/**
 * 合并 main 贡献。
 * @param target 合并目标
 * @param source 当前 atom 的 main 贡献
 */
function mergeMainContribution(
  target: Required<ProjectAtomMainContribution>,
  source?: ProjectAtomMainContribution,
): void {
  if (!source) {
    return
  }

  if (source.mode) {
    target.mode = source.mode
  }
  pushUnique(target.imports, source.imports)
  pushUnique(target.appSetup, source.appSetup)
  pushUnique(target.appUses, source.appUses)
  pushUnique(target.afterAppUses, source.afterAppUses)
  pushUnique(target.setup, source.setup)
  pushUnique(target.afterSetup, source.afterSetup)
}

/**
 * 合并 Vite 贡献。
 * @param target 合并目标
 * @param source 当前 atom 的 Vite 贡献
 */
function mergeViteContribution(
  target: Required<ProjectAtomViteContribution>,
  source?: ProjectAtomViteContribution,
): void {
  if (!source) {
    return
  }

  pushUnique(target.imports, source.imports)
  pushUnique(target.plugins, source.plugins)
  pushUnique(target.scssOptions, source.scssOptions)
}

/**
 * 追加去重后的字符串项，保持首次出现顺序。
 * @param target 合并目标数组
 * @param source 待追加数组
 */
function pushUnique(target: string[], source?: string[]): void {
  if (!source) {
    return
  }

  for (const item of source) {
    if (!target.includes(item)) {
      target.push(item)
    }
  }
}
