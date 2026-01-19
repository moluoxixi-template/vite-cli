/**
 * 深度合并对象
 * - 对象会递归合并
 * - 数组会合并并去重
 * - 基本类型后者覆盖前者
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target }

  for (const key of Object.keys(source)) {
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
      )
    }
    else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      // 合并数组并去重
      result[key] = [...new Set([...targetValue, ...sourceValue])]
    }
    else {
      // 直接覆盖
      result[key] = sourceValue
    }
  }

  return result
}

/**
 * 判断值是否为对象（非数组、非 null）
 * @param val 待判断的值
 * @returns 是否为对象，排除数组和 null
 */
function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}
