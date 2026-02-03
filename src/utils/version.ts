/**
 * 版本工具
 * 获取 CLI 版本号
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 获取 CLI 版本号
 * @returns 版本号字符串
 */
export function getVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf-8'),
    )
    return packageJson.version || '1.0.0'
  }
  catch {
    return '1.0.0'
  }
}
