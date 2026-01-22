/**
 * 通用工具函数
 * 常用工具方法
 */

/**
 * 延迟执行
 * @param ms 延迟毫秒数
 * @returns Promise，在指定时间后 resolve
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 深拷贝
 * @param obj 要拷贝的对象
 * @returns 深拷贝后的新对象
 */
export function deepClone<T>(obj: T, visited = new WeakMap<object, unknown>()): T {
  // 处理基本类型、null 和函数
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // 处理循环引用
  if (visited.has(obj as object)) {
    return visited.get(obj as object) as T
  }

  // 处理 Date
  if (obj instanceof Date) {
    const cloned = new Date(obj.getTime()) as T
    visited.set(obj as object, cloned)
    return cloned
  }

  // 处理 RegExp
  if (obj instanceof RegExp) {
    const cloned = new RegExp(obj.source, obj.flags) as T
    visited.set(obj as object, cloned)
    return cloned
  }

  // 处理 Map
  if (obj instanceof Map) {
    const clonedMap = new Map()
    visited.set(obj as object, clonedMap)
    obj.forEach((value, key) => {
      clonedMap.set(deepClone(key, visited), deepClone(value, visited))
    })
    return clonedMap as T
  }

  // 处理 Set
  if (obj instanceof Set) {
    const clonedSet = new Set()
    visited.set(obj as object, clonedSet)
    obj.forEach((value) => {
      clonedSet.add(deepClone(value, visited))
    })
    return clonedSet as T
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const clonedArray: unknown[] = []
    visited.set(obj as object, clonedArray)
    for (let i = 0; i < obj.length; i++) {
      clonedArray[i] = deepClone(obj[i], visited)
    }
    return clonedArray as T
  }

  // 处理普通对象
  const clonedObj = {} as T
  visited.set(obj as object, clonedObj)
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key], visited)
    }
  }

  return clonedObj
}

/**
 * 防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn 要节流的函数
 * @param delay 间隔时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}
