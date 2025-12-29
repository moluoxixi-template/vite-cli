/**
 * 读取 npm 配置工具
 * 用于获取全局配置作为默认值
 */

import { execSync } from 'node:child_process'

/**
 * 读取 npm 配置值
 * @param key 配置键名
 * @returns 配置值，如果不存在则返回 null
 */
function getNpmConfig(key: string): string | null {
  try {
    const value = execSync(`npm config get ${key}`, { encoding: 'utf-8' }).trim()
    // npm config get 返回 "undefined" 字符串表示未设置
    if (value === 'undefined' || value === '') {
      return null
    }
    return value
  }
  catch {
    return null
  }
}

/**
 * 读取 Git 配置值
 * @param key 配置键名
 * @returns 配置值，如果不存在则返回 null
 */
function getGitConfig(key: string): string | null {
  try {
    const value = execSync(`git config --global ${key}`, { encoding: 'utf-8' }).trim()
    if (value === '') {
      return null
    }
    return value
  }
  catch {
    return null
  }
}

/**
 * 获取默认作者信息
 * 优先级：npm init-author-name/email > git user.name/email
 * @returns 作者字符串，格式：Name <email> 或 Name
 */
export function getDefaultAuthor(): string {
  // 优先从 npm 配置读取
  const npmName = getNpmConfig('init-author-name')
  const npmEmail = getNpmConfig('init-author-email')
  const npmUrl = getNpmConfig('init-author-url')

  // 如果 npm 配置不存在，尝试从 git 配置读取
  const gitName = npmName || getGitConfig('user.name')
  const gitEmail = npmEmail || getGitConfig('user.email')

  // 组合作者信息
  const parts: string[] = []

  if (gitName) {
    parts.push(gitName)
  }

  if (gitEmail) {
    parts.push(`<${gitEmail}>`)
  }

  if (npmUrl && !gitEmail) {
    // 如果有 URL 但没有邮箱，添加 URL
    parts.push(`(${npmUrl})`)
  }

  return parts.join(' ') || ''
}

/**
 * 获取默认许可证
 * @returns 许可证名称，默认为 'MIT'
 */
export function getDefaultLicense(): string {
  return getNpmConfig('init-license') || 'MIT'
}

