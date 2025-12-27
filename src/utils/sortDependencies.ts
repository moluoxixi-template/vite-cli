/**
 * 对依赖对象进行排序
 * 按字母顺序排列
 */
export function sortDependencies(
  dependencies: Record<string, string>,
): Record<string, string> {
  const sorted: Record<string, string> = {}

  const keys = Object.keys(dependencies).sort((a, b) => {
    // @ 开头的包放在前面
    if (a.startsWith('@') && !b.startsWith('@')) {
      return -1
    }
    if (!a.startsWith('@') && b.startsWith('@')) {
      return 1
    }
    return a.localeCompare(b)
  })

  for (const key of keys) {
    sorted[key] = dependencies[key]
  }

  return sorted
}
