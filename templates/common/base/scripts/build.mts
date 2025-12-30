/**
 * 构建后处理脚本
 * 打包生成的 dist 目录为 zip 文件
 */

import path from 'node:path'
import process from 'node:process'
import compressing from 'compressing'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.production' })

const appCode = process.env.VITE_APP_CODE || 'app'
const rootPath = path.resolve()
const distPath = path.join(rootPath, 'dist')
const outputPath = path.join(rootPath, `${appCode}.zip`)

/**
 * 构建 ZIP 压缩包
 * 将 dist 目录压缩为 zip 文件
 * @returns Promise<void>
 * @throws {Error} 如果压缩失败
 */
async function buildZip(): Promise<void> {
  try {
    console.log(`📦 Compressing ${distPath} to ${outputPath}...`)
    await compressing.zip.compressDir(distPath, outputPath)
    console.log(`✅ Successfully created ${outputPath}`)
  }
  catch (error) {
    console.error('❌ Failed to compress:', error)
    process.exit(1)
  }
}

buildZip()
