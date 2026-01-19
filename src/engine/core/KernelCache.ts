/**
 * Kernel 缓存管理器
 * 优化 kernel 编译性能，避免重复编译
 */

interface CachedKernel {
  kernel: any
  timestamp: number
  paramsHash: string
}

/**
 * Kernel 缓存类
 */
export class KernelCache {
  private static instance: KernelCache
  private cache: Map<string, CachedKernel> = new Map()
  private maxCacheSize: number = 50
  private cacheTimeout: number = 5 * 60 * 1000 // 5 分钟

  private constructor() {}

  static getInstance(): KernelCache {
    if (!KernelCache.instance) {
      KernelCache.instance = new KernelCache()
    }
    return KernelCache.instance
  }

  /**
   * 生成参数哈希
   */
  private generateHash(effectType: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${JSON.stringify(params[key])}`)
      .join('|')

    return `${effectType}:${sortedParams}`
  }

  /**
   * 获取缓存的 kernel
   */
  get(effectType: string, params: Record<string, any>): any | null {
    const hash = this.generateHash(effectType, params)
    const cached = this.cache.get(hash)

    if (cached) {
      // 检查是否过期
      const now = Date.now()
      if (now - cached.timestamp > this.cacheTimeout) {
        this.cache.delete(hash)
        return null
      }
      return cached.kernel
    }

    return null
  }

  /**
   * 缓存 kernel
   */
  set(effectType: string, params: Record<string, any>, kernel: any): void {
    const hash = this.generateHash(effectType, params)

    // 如果缓存满了，删除最旧的
    if (this.cache.size >= this.maxCacheSize) {
      const oldest = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
      this.cache.delete(oldest[0])
    }

    this.cache.set(hash, {
      kernel,
      timestamp: Date.now(),
      paramsHash: hash,
    })
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 清除过期缓存
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }
}
