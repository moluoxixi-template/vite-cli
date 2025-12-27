/**
 * Commitizen 自定义配置
 * 定义 commit 类型和提交规范
 */

module.exports = {
  types: [
    { value: 'feat', name: 'feat:     ✨ 新功能' },
    { value: 'fix', name: 'fix:      🐛 修复 Bug' },
    { value: 'docs', name: 'docs:     📝 文档更新' },
    { value: 'style', name: 'style:    💄 代码格式（不影响功能）' },
    { value: 'refactor', name: 'refactor: ♻️  代码重构' },
    { value: 'perf', name: 'perf:     ⚡ 性能优化' },
    { value: 'test', name: 'test:     ✅ 测试相关' },
    { value: 'build', name: 'build:    📦 构建相关' },
    { value: 'ci', name: 'ci:       🔧 CI 配置' },
    { value: 'chore', name: 'chore:    🔨 其他修改' },
    { value: 'revert', name: 'revert:   ⏪ 回退' },
  ],
  scopes: [],
  messages: {
    type: '请选择提交类型:',
    scope: '请输入修改范围（可选）:',
    customScope: '请输入自定义修改范围:',
    subject: '请简要描述提交（必填）:',
    body: '请输入详细描述（可选）:',
    breaking: '列出任何破坏性变更（可选）:',
    footer: '请输入要关闭的 issue（可选）:',
    confirmCommit: '确认使用以上信息提交？',
  },
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  skipQuestions: ['scope', 'body', 'breaking', 'footer'],
  subjectLimit: 100,
}
