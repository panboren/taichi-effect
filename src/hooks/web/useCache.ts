/**
 * 缓存 Hook
 */

import { Storage } from '@/utils/storage'

export interface Cache {
  get(key: string): any
  set(key: string, value: any, options?: { ttl?: number }): void
  delete(key: string): void
  clear(): void
}

export function useCache(type: 'localStorage' | 'sessionStorage' = 'localStorage') {
  const cache = new Storage(type)

  return {
    get: (key: string) => {
      return cache.get(key)
    },
    set: (key: string, value: any, options?: { ttl?: number }) => {
      cache.set(key, value, options)
    },
    delete: (key: string) => {
      cache.delete(key)
    },
    clear: () => {
      cache.clear()
    }
  }
}
