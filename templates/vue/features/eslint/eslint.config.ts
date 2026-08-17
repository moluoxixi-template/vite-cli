import eslintConfig from '@moluoxixi/eslint-config'

export default eslintConfig({
  ignores: [],
  rules: {
    //#region 不能在定义前使用变量
    'no-use-before-define': 'off',
    'ts/no-use-before-define': 'off',
    // #endregion
    // import 排序
    'perfectionist/sort-imports': 'off',
    // 未使用的变量
    'unused-imports/no-unused-vars': 'off',
    // 不允许使用console
    'no-console': 'off',
    // 是否使用function声明顶级函数，开启后会导致偶先eslint格式失败，当文件中eslint格式问题过多时建议关闭，不多时保留此注释
    // 'antfu/top-level-function': 'off',
  },
})
