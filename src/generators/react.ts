/**
 * React 项目生成器
 * 采用物理路径合并 + EJS 模板 + 数据驱动配置
 */

import type { ProjectConfigType } from '../types/index.ts'

import { generateFrameworkProject } from '../utils/index.ts'

/**
 * 生成 React 项目
 */
export async function generateReactProject(config: ProjectConfigType): Promise<void> {
  generateFrameworkProject(config, {
    mainTemplate: 'src/main.tsx.ejs',
    mainOutput: 'src/main.tsx',
    routerTemplate: 'src/router/index.tsx.ejs',
    routerOutput: 'src/router/index.tsx',
  })
}
