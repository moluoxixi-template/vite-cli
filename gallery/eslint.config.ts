import eslintConfig from '@moluoxixi/eslint-config'

export default eslintConfig({
  ignores: ['dist', 'coverage'],
  rules: {
    'perfectionist/sort-imports': 'off',
  },
})
