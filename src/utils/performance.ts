/**
 * 性能优化工具函数
 */

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = interval - (now - lastTime)

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastTime = now
      fn.apply(this, args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now()
        timeoutId = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * requestAnimationFrame 节流
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T,
): (...args: Parameters<T>) => void {
  let rafId: number | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args)
      rafId = null
    })
  }
}

/**
 * 批量执行函数
 */
export async function batchExecute<T, R>(
  items: T[],
  executor: (item: T) => Promise<R>,
  batchSize: number = 10,
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(executor))
    results.push(...batchResults)
  }

  return results
}

/**
 * 性能测量
 */
export class PerformanceMeasure {
  private startTime: number
  private name: string

  constructor(name: string) {
    this.name = name
    this.startTime = performance.now()
  }

  end(): number {
    const duration = performance.now() - this.startTime
    console.log(`[Performance] ${this.name}: ${duration.toFixed(2)}ms`)
    return duration
  }

  static measure<T>(name: string, fn: () => T): T {
    const measure = new PerformanceMeasure(name)
    try {
      return fn()
    } finally {
      measure.end()
    }
  }

  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const measure = new PerformanceMeasure(name)
    try {
      return await fn()
    } finally {
      measure.end()
    }
  }
}
