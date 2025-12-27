import eslintConfig from '@moluoxixi/eslint-config'

export default eslintConfig({
  react: true,
  typescript: true,
  ignores: [],
  rules: {
    'perfectionist/sort-imports': 'off',
    'jsonc/sort-keys': 'off',
  },
})

