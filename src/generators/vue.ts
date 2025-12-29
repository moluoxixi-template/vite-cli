/**
 * Vue 项目生成器
 * 采用物理路径合并 + EJS 模板 + 数据驱动配置
 */

import type { ProjectConfigType } from '../types/index.ts'

import { generateFrameworkProject } from '../utils/index.ts'

/**
 * 生成 Vue 项目
 */
export async function generateVueProject(config: ProjectConfigType): Promise<void> {
  generateFrameworkProject(config, {
    mainTemplate: 'src/main.ts.ejs',
    mainOutput: 'src/main.ts',
    routerTemplate: 'src/router/index.ts.ejs',
    routerOutput: 'src/router/index.ts',
  })
}
