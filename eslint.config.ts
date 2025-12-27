/**
 * ESLint 配置
 * 使用 @moluoxixi/eslint-config 进行代码规范检查
 */

import eslintConfig from '@moluoxixi/eslint-config'

export default eslintConfig({
  ignores: ['dist', 'templates'],
  rules: {
    'perfectionist/sort-imports': 'off',
    'jsonc/sort-keys': 'off',
  },
})
