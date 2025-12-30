/**
 * 项目常量定义
 * 统一管理所有硬编码的字符串和配置值
 */

/**
 * 文件系统相关常量
 */
export const FILE_CONSTANTS = {
  /** node_modules 目录名 */
  NODE_MODULES: 'node_modules',
  /** package.json 文件名 */
  PACKAGE_JSON: 'package.json',
  /** .ejs 文件扩展名 */
  EJS_EXTENSION: '.ejs',
  /** vite.config.data.ts 文件名 */
  VITE_CONFIG_DATA: 'vite.config.data.ts',
  /** pnpm-workspace.yaml 文件名 */
  PNPM_WORKSPACE_YAML: 'pnpm-workspace.yaml',
} as const

/**
 * Vite 配置相关常量
 */
export const VITE_CONFIG_CONSTANTS = {
  /** API 代理路径 */
  API_PROXY_PATH: '/api',
  /** 开发服务器代理目标 */
  DEV_SERVER_TARGET: 'http://localhost:3000',
  /** SCSS 弃用警告配置 */
  SCSS_DEPRECATION: 'legacy-js-api',
  /** SCSS API 模式 */
  SCSS_API_MODE: 'modern-compiler',
} as const

/**
 * 包管理器相关常量
 */
export const PACKAGE_MANAGER_CONSTANTS = {
  /** 包管理器默认版本映射 */
  VERSIONS: {
    pnpm: '10.8.0',
    npm: '10.9.0',
    yarn: '4.1.0',
  } as const,
  /** 默认包管理器 */
  DEFAULT: 'pnpm' as const,
} as const

/**
 * 项目配置相关常量
 */
export const PROJECT_CONSTANTS = {
  /** 默认项目名称 */
  DEFAULT_PROJECT_NAME: 'my-project',
  /** 默认项目描述 */
  DEFAULT_DESCRIPTION: 'A Vite project',
  /** 项目名称最大长度 */
  MAX_PROJECT_NAME_LENGTH: 214,
  /** 项目名称最小长度 */
  MIN_PROJECT_NAME_LENGTH: 1,
  /** 系统保留的项目名称（npm 包名保留字） */
  RESERVED_NAMES: [
    'node',
    'npm',
    'test',
    'lib',
    'api',
    'www',
    'admin',
    'root',
    'config',
    'build',
    'dist',
    'src',
    'public',
    'private',
  ] as const,
} as const

/**
 * 文件名转换相关常量
 */
export const FILE_RENAME_CONSTANTS = {
  /** 需要重命名的文件前缀 */
  RENAME_PREFIX: '_',
  /** 重命名后的文件前缀 */
  RENAMED_PREFIX: '.',
} as const
