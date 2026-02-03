/**
 * 依赖管理工具
 * 根据配置生成 package.json 依赖列表
 */

import type { ProjectConfig } from '../types'

/**
 * 获取项目依赖
 * @param config 项目配置
 * @returns 依赖对象
 */
export function getDependencies(config: ProjectConfig): Record<string, string> {
  const deps: Record<string, string> = {
    // 工具库（必选）
    '@moluoxixi/ajax-package': 'latest',
    '@moluoxixi/class-names': 'latest',
    'lodash-es': '^4.17.21',
    'radash': '^12.1.0',
    'dayjs': '^1.11.13',
    'uuid': '^11.1.0',
    'crypto-js': '^4.2.0',
  }

  // 根据框架添加依赖
  if (config.framework === 'vue') {
    deps.vue = '^3.5.13'
    deps['vue-router'] = '^4.5.0'
    deps.pinia = '^2.3.0'
    deps['pinia-plugin-persistedstate'] = '^4.2.0'

    // UI 库
    if (config.uiLibrary === 'element-plus') {
      deps['element-plus'] = '^2.11.3'
      deps['@element-plus/icons-vue'] = '^2.3.1'
    }
    else if (config.uiLibrary === 'ant-design-vue') {
      deps['ant-design-vue'] = '^4.2.1'
      deps['@ant-design/icons-vue'] = '^7.0.1'
    }

    // 国际化
    if (config.i18n) {
      deps['vue-i18n'] = '^11.1.10'
    }

    // 错误监控
    if (config.sentry) {
      deps['@sentry/vue'] = '^9.27.0'
      deps['@sentry/vite-plugin'] = '^3.5.0'
    }
  }
  else if (config.framework === 'react') {
    deps.react = '^18.3.1'
    deps['react-dom'] = '^18.3.1'
    deps['react-router-dom'] = '^6.26.0'
    deps.zustand = '^4.5.5'

    // UI 库
    if (config.uiLibrary === 'ant-design') {
      deps.antd = '^5.21.0'
      deps['@ant-design/icons'] = '^5.3.7'
    }

    // 国际化
    if (config.i18n) {
      deps['react-i18next'] = '^15.1.0'
      deps.i18next = '^24.2.0'
    }

    // 错误监控
    if (config.sentry) {
      deps['@sentry/react'] = '^9.27.0'
      deps['@sentry/vite-plugin'] = '^3.5.0'
    }
  }

  // 路由模式
  if (config.routeMode === 'file-system') {
    deps['vite-plugin-pages'] = '^0.32.0'
  }

  // 微前端
  if (config.qiankun) {
    deps['vite-plugin-qiankun'] = '^1.0.15'
  }

  return deps
}

/**
 * 获取开发依赖
 * @param config 项目配置
 * @returns 开发依赖对象
 */
export function getDevDependencies(config: ProjectConfig): Record<string, string> {
  const devDeps: Record<string, string> = {
    // 构建工具
    'vite': '^6.2.4',
    'typescript': '~5.8.0',
    // 代码规范
    '@moluoxixi/eslint-config': 'latest',
    '@moluoxixi/vite-config': 'latest',
    '@moluoxixi/css-module-global-root-plugin': 'latest',
    '@moluoxixi/ajax-package': 'latest',
    'eslint': '^9.22.0',
    'eslint-plugin-format': '^1.0.1',
    // Git 提交规范
    '@commitlint/cli': '^19.8.0',
    '@commitlint/config-conventional': '^19.8.0',
    'commitizen': '^4.3.1',
    'cz-customizable': '^7.4.0',
    'husky': '^9.1.7',
    'lint-staged': '^15.5.1',
    // 样式处理
    'sass': '^1.87.0',
    'sass-embedded': '^1.87.0',
    'sass-loader': '^16.0.5',
    'tailwindcss': '^4.0.0',
    'postcss': '^8.5.3',
    'autoprefixer': '^10.4.20',
    // 其他工具
    'dotenv': '^16.5.0',
    'jiti': '^2.4.2',
    'tsx': '^4.20.5',
    // 类型定义
    '@types/node': '^22.14.0',
    '@types/uuid': '^10.0.0',
    '@types/crypto-js': '^4.2.2',
    '@types/lodash': '^4.17.17',
  }

  // 根据框架添加开发依赖
  if (config.framework === 'vue') {
    devDeps['vue-tsc'] = '^2.2.8'
    devDeps['@vue-macros/volar'] = '^3.0.0-beta.15'
  }
  else if (config.framework === 'react') {
    devDeps['@vitejs/plugin-react'] = '^4.3.1'
    devDeps['@types/react'] = '^18.3.12'
    devDeps['@types/react-dom'] = '^18.3.1'
  }

  return devDeps
}
