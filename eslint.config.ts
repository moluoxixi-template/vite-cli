/**
 * ESLint 配置
 * 使用 @moluoxixi/eslint-config 进行代码规范检查
 */

import eslintConfig from '@moluoxixi/eslint-config'

export default eslintConfig({
  ignores: [
    'package.json',
  ],
  rules: {
    // import排序
    'perfectionist/sort-imports': 'off',
    // jsonc排序
    'jsonc/sort-keys': 'off',
    // 不允许使用console
    'no-console': 'off',
  },
})
