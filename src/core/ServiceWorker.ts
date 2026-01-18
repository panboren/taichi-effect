/**
 * Service Worker 管理
 * 实现离线支持、缓存策略、后台同步
 */

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private updateHandler: ((registration: ServiceWorkerRegistration) => void) | null = null

  /**
   * 注册 Service Worker
   */
  async register(): Promise<boolean> {
    // 检查环境
    if (!('serviceWorker' in navigator)) {
      console.warn('当前浏览器不支持 Service Worker')
      return false
    }

    // 只在生产环境启用
    if (import.meta.env.DEV) {
      console.log('开发环境跳过 Service Worker 注册')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      this.registration = registration

      // 监听更新
      registration.addEventListener('updatefound', this.handleUpdateFound.bind(this))

      // 监听已激活的 Service Worker
      if (registration.active) {
        console.log('Service Worker 已激活:', registration.active)
      }

      // 监听控制权变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker 控制权已变更')
        window.location.reload()
      })

      console.log('Service Worker 注册成功:', registration)
      return true
    } catch (error) {
      console.error('Service Worker 注册失败:', error)
      return false
    }
  }

  /**
   * 处理 Service Worker 更新
   */
  private handleUpdateFound() {
    if (!this.registration) return

    const newWorker = this.registration.installing
    if (!newWorker) return

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && this.registration?.waiting) {
        // 新版本已准备好，等待用户刷新
        console.log('新版本已准备好，等待刷新')
        this.updateHandler?.(this.registration!)
      }
    })
  }

  /**
   * 设置更新处理器
   */
  onUpdate(handler: (registration: ServiceWorkerRegistration) => void) {
    this.updateHandler = handler
  }

  /**
   * 立即激活新版本
   */
  async activateUpdate(): Promise<void> {
    if (!this.registration?.waiting) return

    // 发送消息给 waiting worker 让它跳过等待
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  /**
   * 检查更新
   */
  async checkUpdate(): Promise<boolean> {
    if (!this.registration) return false

    try {
      await this.registration.update()
      return true
    } catch (error) {
      console.error('检查更新失败:', error)
      return false
    }
  }

  /**
   * 取消注册
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false

    try {
      const result = await this.registration.unregister()
      this.registration = null
      console.log('Service Worker 已取消注册')
      return result
    } catch (error) {
      console.error('取消注册失败:', error)
      return false
    }
  }

  /**
   * 获取注册状态
   */
  getRegistration() {
    return this.registration
  }

  /**
   * 是否支持
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator
  }
}

export const serviceWorkerManager = new ServiceWorkerManager()
export default serviceWorkerManager
