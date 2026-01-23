/**
 * 构建后处理脚本
 * 打包生成的构建输出目录为 zip 文件
 */

import path from 'node:path'
import process from 'node:process'
import compressing from 'compressing'
import dotenv from 'dotenv'
import { resolveConfig } from 'vite'

/**
 * 构建 ZIP 压缩包
 * 将构建输出目录压缩为 zip 文件
 * @returns Promise<void>
 * @throws {Error} 如果压缩失败
 */
async function buildZip(): Promise<void> {
  try {
    // 加载环境变量
    dotenv.config({ path: '.env.production' })

    // 获取 Vite 配置中的输出目录
    const viteConfig = await resolveConfig({}, 'build', 'production')
    const buildoutputDir = viteConfig.build.outDir

    const appCode = process.env.VITE_APP_CODE
    const rootPath = path.resolve()
    const distPath = path.join(rootPath, buildoutputDir)
    const outputPath = path.join(rootPath, `${appCode}.zip`)

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
