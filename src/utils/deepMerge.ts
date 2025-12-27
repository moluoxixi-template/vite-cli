/**
 * 深度合并对象
 * - 对象会递归合并
 * - 数组会合并并去重
 * - 基本类型后者覆盖前者
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target }

  for (const key of Object.keys(source) as Array<keyof T>) {
    const targetValue = result[key]
    const sourceValue = source[key]

    if (sourceValue === undefined) {
      continue
    }

    if (isObject(targetValue) && isObject(sourceValue)) {
      // 递归合并对象
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      ) as T[keyof T]
    }
    else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      // 合并数组并去重
      result[key] = [...new Set([...targetValue, ...sourceValue])] as T[keyof T]
    }
    else {
      // 直接覆盖
      result[key] = sourceValue as T[keyof T]
    }
  }

  return result
}

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}
