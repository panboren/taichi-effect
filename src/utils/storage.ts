/**
 * 本地存储工具
 */

export class Storage {
  private storage: StorageType

  constructor(type: 'localStorage' | 'sessionStorage' = 'localStorage') {
    this.storage = window[type]
  }

  /**
   * 获取值
   */
  get(key: string): any {
    const value = this.storage.getItem(key)
    if (!value) return null

    try {
      return JSON.parse(value)
    } catch (e) {
      return value
    }
  }

  /**
   * 设置值
   */
  set(key: string, value: any, options?: { ttl?: number }): void {
    const data = {
      value,
      expires: options?.ttl ? Date.now() + options.ttl * 1000 : null
    }
    this.storage.setItem(key, JSON.stringify(data))
  }

  /**
   * 删除值
   */
  delete(key: string): void {
    this.storage.removeItem(key)
  }

  /**
   * 清空
   */
  clear(): void {
    this.storage.clear()
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    const value = this.storage.getItem(key)
    if (!value) return false

    try {
      const data = JSON.parse(value)
      if (data.expires && data.expires < Date.now()) {
        this.delete(key)
        return false
      }
      return true
    } catch (e) {
      return false
    }
  }
}

type StorageType = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}
