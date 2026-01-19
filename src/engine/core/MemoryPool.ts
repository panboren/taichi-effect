/**
 * GPU 内存池管理器
 * 复用像素字段，减少内存分配开销
 */

import * as ti from 'taichi.js'

interface PoolEntry {
  pixels: any
  width: number
  height: number
  inUse: boolean
  lastUsed: number
}

/**
 * 内存池类
 */
export class MemoryPool {
  private static instance: MemoryPool
  private pool: Map<string, PoolEntry[]> = new Map()
  private maxPoolSize: number = 5
  private reuseTimeout: number = 2 * 60 * 1000 // 2 分钟

  private constructor() {}

  static getInstance(): MemoryPool {
    if (!MemoryPool.instance) {
      MemoryPool.instance = new MemoryPool()
    }
    return MemoryPool.instance
  }

  /**
   * 生成尺寸键
   */
  private getSizeKey(width: number, height: number): string {
    return `${width}x${height}`
  }

  /**
   * 从池中获取像素字段
   */
  acquire(width: number, height: number): any | null {
    const key = this.getSizeKey(width, height)
    const entries = this.pool.get(key) || []

    // 查找可复用的像素字段
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (!entry.inUse) {
        entry.inUse = true
        entry.lastUsed = Date.now()
        return entry.pixels
      }
    }

    // 没有可复用的，创建新的
    const pixels = ti.Vector.field(4, ti.f32, [width, height])
    const newEntry: PoolEntry = {
      pixels,
      width,
      height,
      inUse: true,
      lastUsed: Date.now(),
    }

    entries.push(newEntry)
    this.pool.set(key, entries)

    return pixels
  }

  /**
   * 释放像素字段回池中
   */
  release(pixels: any, width: number, height: number): void {
    const key = this.getSizeKey(width, height)
    const entries = this.pool.get(key)

    if (entries) {
      for (const entry of entries) {
        if (entry.pixels === pixels) {
          entry.inUse = false
          entry.lastUsed = Date.now()
          return
        }
      }
    }
  }

  /**
   * 清理未使用的像素字段
   */
  cleanup(): void {
    const now = Date.now()

    for (const [key, entries] of this.pool.entries()) {
      // 移除超时未使用的
      const filtered = entries.filter(
        (entry) => now - entry.lastUsed <= this.reuseTimeout || entry.inUse,
      )

      // 如果同尺寸的太多了，移除旧的
      while (filtered.length > this.maxPoolSize) {
        const oldestIdx = filtered.reduce((oldestIdx, entry, idx, arr) => {
          return entry.lastUsed < arr[oldestIdx].lastUsed && !entry.inUse ? idx : oldestIdx
        }, 0)
        filtered.splice(oldestIdx, 1)
      }

      this.pool.set(key, filtered)
    }
  }

  /**
   * 清空内存池
   */
  clear(): void {
    this.pool.clear()
  }

  /**
   * 获取统计信息
   */
  getStats(): { totalEntries: number; inUse: number; bySize: Record<string, number> } {
    let totalEntries = 0
    let inUse = 0
    const bySize: Record<string, number> = {}

    for (const [key, entries] of this.pool.entries()) {
      totalEntries += entries.length
      inUse += entries.filter((e) => e.inUse).length
      bySize[key] = entries.length
    }

    return { totalEntries, inUse, bySize }
  }
}
