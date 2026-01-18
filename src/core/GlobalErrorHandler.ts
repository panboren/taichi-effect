/**
 * 全局错误处理器
 * 集成 Sentry、日志上报、错误追踪
 */

import type { App } from 'vue'
import { ElNotification } from 'element-plus'
import type { ErrorLog } from '@/types'

class GlobalErrorHandler {
  private errorLogs: ErrorLog[] = []
  private maxLogs = 50
  private isDevelopment = import.meta.env.DEV

  /**
   * 初始化
   */
  install(app: App) {
    // Vue 错误捕获
    app.config.errorHandler = this.handleError.bind(this)

    // 全局未捕获 Promise 错误
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))

    // 全局未捕获异常
    window.addEventListener('error', this.handleWindowError.bind(this))

    // 资源加载错误
    window.addEventListener('error', this.handleResourceError.bind(this), true)

    // 禁用控制台拦截，避免循环问题
    // if (this.isDevelopment) {
    //   this.interceptConsole()
    // }
  }

  /**
   * Vue 错误处理
   */
  private handleError(err: unknown, vm: unknown, info: string) {
    const errorLog: ErrorLog = {
      type: 'vue',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : '',
      info,
      url: window.location.href,
      time: new Date().toISOString()
    }

    this.addErrorLog(errorLog)
    this.reportError(errorLog)

    // 生产环境显示友好提示
    if (!this.isDevelopment) {
      ElNotification.error({
        title: '系统错误',
        message: '页面发生错误，请刷新重试',
        duration: 3000
      })
    }
  }

  /**
   * 未捕获的 Promise 错误
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const errorLog: ErrorLog = {
      type: 'promise',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack || '',
      url: window.location.href,
      time: new Date().toISOString()
    }

    this.addErrorLog(errorLog)
    this.reportError(errorLog)

    // 阻止默认控制台输出
    event.preventDefault()
  }

  /**
   * Window 错误处理
   */
  private handleWindowError(event: ErrorEvent) {
    const errorLog: ErrorLog = {
      type: 'window',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack || '',
      url: window.location.href,
      time: new Date().toISOString()
    }

    this.addErrorLog(errorLog)
    this.reportError(errorLog)
  }

  /**
   * 资源加载错误
   */
  private handleResourceError(event: Event) {
    const target = event.target as HTMLElement
    if (target?.tagName === 'IMG' || target?.tagName === 'SCRIPT' || target?.tagName === 'LINK') {
      const errorLog: ErrorLog = {
        type: 'resource',
        message: `资源加载失败: ${(target as HTMLImageElement).src}`,
        url: window.location.href,
        time: new Date().toISOString()
      }

      this.addErrorLog(errorLog)
      this.reportError(errorLog)
    }
  }

  /**
   * 添加错误日志
   */
  private addErrorLog(errorLog: ErrorLog) {
    this.errorLogs.unshift(errorLog)
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.pop()
    }

    // 存储到 localStorage
    try {
      localStorage.setItem('error-logs', JSON.stringify(this.errorLogs))
    } catch (e) {
      console.warn('无法存储错误日志到 localStorage', e)
    }

    // 开发环境打印
    if (this.isDevelopment) {
      console.group(`[${errorLog.type.toUpperCase()}] ${errorLog.message}`)
      console.error(errorLog)
      console.groupEnd()
    }
  }

  /**
   * 上报错误到服务器
   */
  private async reportError(errorLog: ErrorLog) {
    // 只在生产环境上报
    if (this.isDevelopment) return

    try {
      const reportUrl = import.meta.env.VITE_ERROR_REPORT_URL
      if (!reportUrl) return

      // 使用 navigator.sendBeacon 进行上报（不会阻塞页面卸载）
      const blob = new Blob([JSON.stringify(errorLog)], {
        type: 'application/json'
      })
      navigator.sendBeacon(reportUrl, blob)
    } catch (e) {
      console.warn('错误上报失败', e)
    }
  }

  /**
   * 拦截 console
   */
  private interceptConsole() {
    const methods = ['error', 'warn'] as const
    const originalConsole: Record<string, any> = {}

    methods.forEach((method) => {
      originalConsole[method] = console[method]

      console[method] = (...args: any[]) => {
        // 调用原始方法
        originalConsole[method].apply(console, args)

        // 记录错误
        const errorLog: ErrorLog = {
          type: 'console',
          message: args.map((arg) => String(arg)).join(' '),
          stack: new Error().stack || '',
          url: window.location.href,
          time: new Date().toISOString()
        }

        this.addErrorLog(errorLog)
      }
    })
  }

  /**
   * 获取所有错误日志
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs]
  }

  /**
   * 清空错误日志
   */
  clearErrorLogs() {
    this.errorLogs = []
    localStorage.removeItem('error-logs')
  }

  /**
   * 手动上报错误
   */
  report(error: Error | string, context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      type: 'manual',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : '',
      context,
      url: window.location.href,
      time: new Date().toISOString()
    }

    this.addErrorLog(errorLog)
    this.reportError(errorLog)
  }
}

export const globalErrorHandler = new GlobalErrorHandler()
export default globalErrorHandler
