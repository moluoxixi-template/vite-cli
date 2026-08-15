/**
 * 模板验证工具
 * 用于验证模板结构的完整性和正确性
 */

import path from 'node:path'
import fs from 'fs-extra'
import {
  FRAMEWORKS,
  MICRO_FRONTEND_ENGINES,
  ROUTE_MODES,
  STATE_MANAGEMENT_MAP,
  UI_LIBRARIES,
} from '@/constants'

/**
 * 模板信息接口
 */
export interface TemplateInfo {
  name: string
  path: string
  packageJsonPath: string
  type: 'common-base' | 'common-feature' | 'framework-base' | 'framework-feature' | 'microfrontend-base' | 'microfrontend-feature'
  framework?: string
  microFrontendEngine?: string
}

/**
 * 检查 common 和框架中是否存在 base 和可选 feature
 * @param templatesDir 模板根目录
 * @returns 检查结果和模板列表
 */
export function checkBaseAndFeatures(templatesDir: string): {
  templates: TemplateInfo[]
  errors: string[]
} {
  const templates: TemplateInfo[] = []
  const errors: string[] = []

  // 1. 检查 common/base
  const commonBasePath = path.join(templatesDir, 'common/base')
  if (!fs.existsSync(commonBasePath)) {
    errors.push('❌ common/base 不存在')
  }
  else {
    templates.push({
      name: 'common/base',
      path: commonBasePath,
      packageJsonPath: path.join(commonBasePath, 'package.json'),
      type: 'common-base',
    })
  }

  // 2. 检查 common/features/*
  const commonFeaturesDir = path.join(templatesDir, 'common/features')
  if (fs.existsSync(commonFeaturesDir)) {
    const features = fs.readdirSync(commonFeaturesDir)
    for (const feature of features) {
      const featurePath = path.join(commonFeaturesDir, feature)
      if (fs.statSync(featurePath).isDirectory()) {
        templates.push({
          name: `common/features/${feature}`,
          path: featurePath,
          packageJsonPath: path.join(featurePath, 'package.json'),
          type: 'common-feature',
        })
      }
    }
  }

  // 3. 检查每个框架的 base 和 features
  for (const framework of FRAMEWORKS) {
    const frameworkBasePath = path.join(templatesDir, framework, 'base')
    if (!fs.existsSync(frameworkBasePath)) {
      errors.push(`❌ ${framework}/base 不存在`)
    }
    else {
      templates.push({
        name: `${framework}/base`,
        path: frameworkBasePath,
        packageJsonPath: path.join(frameworkBasePath, 'package.json'),
        type: 'framework-base',
        framework,
      })
    }

    // 检查框架 features
    const frameworkFeaturesDir = path.join(templatesDir, framework, 'features')
    if (fs.existsSync(frameworkFeaturesDir)) {
      const features = fs.readdirSync(frameworkFeaturesDir)
      for (const feature of features) {
        const featurePath = path.join(frameworkFeaturesDir, feature)
        if (fs.statSync(featurePath).isDirectory()) {
          templates.push({
            name: `${framework}/features/${feature}`,
            path: featurePath,
            packageJsonPath: path.join(featurePath, 'package.json'),
            type: 'framework-feature',
            framework,
          })
        }
      }
    }

    // 4. 检查微前端
    const microFrontendsDir = path.join(templatesDir, framework, 'micro-frontends')
    if (fs.existsSync(microFrontendsDir)) {
      const engines = fs.readdirSync(microFrontendsDir).filter((item) => {
        const itemPath = path.join(microFrontendsDir, item)
        return fs.statSync(itemPath).isDirectory()
      })

      for (const engine of engines) {
        // 检查微前端 base
        const microFrontendBasePath = path.join(microFrontendsDir, engine, 'base')
        if (!fs.existsSync(microFrontendBasePath)) {
          errors.push(`❌ ${framework}/micro-frontends/${engine}/base 不存在`)
        }
        else {
          templates.push({
            name: `${framework}/micro-frontends/${engine}/base`,
            path: microFrontendBasePath,
            packageJsonPath: path.join(microFrontendBasePath, 'package.json'),
            type: 'microfrontend-base',
            framework,
            microFrontendEngine: engine,
          })
        }

        // 检查微前端 features
        const microFrontendFeaturesDir = path.join(microFrontendsDir, engine, 'features')
        if (fs.existsSync(microFrontendFeaturesDir)) {
          const features = fs.readdirSync(microFrontendFeaturesDir)
          for (const feature of features) {
            const featurePath = path.join(microFrontendFeaturesDir, feature)
            if (fs.statSync(featurePath).isDirectory()) {
              templates.push({
                name: `${framework}/micro-frontends/${engine}/features/${feature}`,
                path: featurePath,
                packageJsonPath: path.join(featurePath, 'package.json'),
                type: 'microfrontend-feature',
                framework,
                microFrontendEngine: engine,
              })
            }
          }
        }
      }
    }
  }

  return { templates, errors }
}

/**
 * 检查 constants 中维护的 feature 是否在文件系统中存在
 * @param templatesDir 模板根目录
 * @returns 检查结果和错误列表
 */
export function checkConstantsFeatures(templatesDir: string): {
  errors: string[]
} {
  const errors: string[] = []

  // 1. 检查 UI_LIBRARIES 中定义的 UI 库 feature
  for (const framework of FRAMEWORKS) {
    const uiLibraries = UI_LIBRARIES[framework]
    const frameworkFeaturesDir = path.join(templatesDir, framework, 'features')

    for (const uiLibrary of uiLibraries) {
      const uiLibraryPath = path.join(frameworkFeaturesDir, uiLibrary)
      if (!fs.existsSync(uiLibraryPath)) {
        errors.push(`❌ ${framework}/features/${uiLibrary} 不存在（在 UI_LIBRARIES 中定义）`)
      }
    }
  }

  // 2. 检查 ROUTE_MODES 中定义的路由模式 feature
  for (const framework of FRAMEWORKS) {
    const frameworkFeaturesDir = path.join(templatesDir, framework, 'features')

    for (const routeMode of ROUTE_MODES) {
      const routeModePath = path.join(frameworkFeaturesDir, routeMode)
      if (!fs.existsSync(routeModePath)) {
        errors.push(`❌ ${framework}/features/${routeMode} 不存在（在 ROUTE_MODES 中定义）`)
      }
    }
  }

  // 3. 检查 MICRO_FRONTEND_ENGINES 中定义的微前端引擎
  for (const framework of FRAMEWORKS) {
    const microFrontendsDir = path.join(templatesDir, framework, 'micro-frontends')

    for (const engine of MICRO_FRONTEND_ENGINES) {
      const enginePath = path.join(microFrontendsDir, engine)
      if (!fs.existsSync(enginePath)) {
        errors.push(`❌ ${framework}/micro-frontends/${engine} 不存在（在 MICRO_FRONTEND_ENGINES 中定义）`)
      }
    }
  }

  // 4. 检查 STATE_MANAGEMENT_MAP 中定义的状态管理库 feature
  for (const framework of FRAMEWORKS) {
    const stateManagement = STATE_MANAGEMENT_MAP[framework]
    const frameworkFeaturesDir = path.join(templatesDir, framework, 'features')
    const stateManagementPath = path.join(frameworkFeaturesDir, stateManagement)

    if (!fs.existsSync(stateManagementPath)) {
      errors.push(`❌ ${framework}/features/${stateManagement} 不存在（在 STATE_MANAGEMENT_MAP 中定义）`)
    }
  }

  return { errors }
}

/**
 * 扫描目录下的所有源代码文件
 * @param dir 目录路径
 * @returns 源代码文件路径数组
 */
export function scanSourceFiles(dir: string): string[] {
  const files: string[] = []

  function scan(currentDir: string): void {
    if (!fs.existsSync(currentDir)) {
      return
    }

    let entries
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true })
    }
    catch (error) {
      // 跳过无法读取的目录
      console.warn(`${currentDir}文件无法读取`, error)
      return
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      // 跳过隐藏文件和目录
      if (entry.name.startsWith('.')) {
        continue
      }

      if (entry.isDirectory()) {
        // 跳过特定目录
        const skipDirs = ['node_modules', 'dist', 'coverage', '__test__']
        if (!skipDirs.includes(entry.name)) {
          scan(fullPath)
        }
      }
      else if (/\.(?:ts|tsx|js|jsx|vue)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        files.push(fullPath)
      }
    }
  }

  scan(dir)
  return files
}
