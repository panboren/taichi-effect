/**
 * 性能监控
 * 监控页面加载、渲染、资源等性能指标
 */

import { onUnmounted, type App } from 'vue'

interface PerformanceMetrics {
  // 核心指标
  FCP?: number // First Contentful Paint
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  TTFB?: number // Time to First Byte

  // 自定义指标
  firstRender?: number // 首次渲染时间
  routeChange?: number // 路由切换时间
  apiRequest?: number[] // API 请求时间

  // 资源指标
  slowResources?: PerformanceEntry[]
  longTasks?: PerformanceEntry[]
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []
  private isSupported = typeof PerformanceObserver !== 'undefined'
  private navigationStart = performance.timing?.navigationStart || Date.now()

  /**
   * 安装
   */
  install(app: App) {
    this.initCoreMetrics()
    this.initResourceMonitor()
    this.initLongTaskMonitor()
  }

  /**
   * 初始化核心性能指标
   */
  private initCoreMetrics() {
    if (!this.isSupported) return

    try {
      // FCP - 首次内容绘制
      this.observe('paint', (entries) => {
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = Math.round(entry.startTime)
          }
        }
      })

      // LCP - 最大内容绘制
      this.observe('largest-contentful-paint', (entries) => {
        const lastEntry = entries[entries.length - 1]
        this.metrics.LCP = Math.round(lastEntry.startTime)
      })

      // FID - 首次输入延迟
      this.observe('first-input', (entries) => {
        for (const entry of entries) {
          this.metrics.FID = Math.round(entry.processingStart - entry.startTime)
        }
      })

      // CLS - 累积布局偏移
      let clsValue = 0
      this.observe('layout-shift', (entries) => {
        for (const entry of entries) {
          if (!(entry as any).hadRecentInput) {
            clsValue += entry.value
            this.metrics.CLS = parseFloat(clsValue.toFixed(4))
          }
        }
      })
    } catch (e) {
      console.warn('性能监控初始化失败', e)
    }

    // TTFB - 首字节时间
    this.metrics.TTFB = Math.round(
      (performance.timing?.responseStart || 0) - this.navigationStart
    )
  }

  /**
   * 监控资源加载
   */
  private initResourceMonitor() {
    if (!this.isSupported) return

    this.observe('resource', (entries) => {
      const slowResources: PerformanceEntry[] = []
      const SLOW_THRESHOLD = 1000 // 1秒

      for (const entry of entries) {
        if (entry.duration > SLOW_THRESHOLD) {
          slowResources.push(entry)
        }
      }

      if (slowResources.length > 0) {
        this.metrics.slowResources = [
          ...(this.metrics.slowResources || []),
          ...slowResources
        ].slice(-20) // 只保留最近20个
      }
    })
  }

  /**
   * 监控长任务
   */
  private initLongTaskMonitor() {
    if (!this.isSupported) return

    try {
      this.observe('longtask', (entries) => {
        this.metrics.longTasks = [
          ...(this.metrics.longTasks || []),
          ...entries
        ].slice(-20) // 只保留最近20个
      })
    } catch (e) {
      // longtask 可能不被支持
    }
  }

  /**
   * 观察性能条目
   */
  private observe(
    type: string,
    callback: (entries: PerformanceEntryList) => void
  ) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      observer.observe({ type, buffered: true })
      this.observers.push(observer)
    } catch (e) {
      console.warn(`无法监听 ${type} 性能指标`, e)
    }
  }

  /**
   * 记录路由切换时间
   */
  measureRouteChange(from: string, to: string) {
    const start = performance.now()
    return () => {
      const duration = Math.round(performance.now() - start)
      this.metrics.routeChange = duration

      if (duration > 500) {
        console.warn(`路由切换耗时过长: ${from} -> ${to} (${duration}ms)`)
      }
    }
  }

  /**
   * 记录 API 请求时间
   */
  measureApiRequest(url: string) {
    const start = performance.now()
    return () => {
      const duration = Math.round(performance.now() - start)

      if (!this.metrics.apiRequest) {
        this.metrics.apiRequest = []
      }
      this.metrics.apiRequest.push(duration)

      // 只保留最近100次请求
      if (this.metrics.apiRequest.length > 100) {
        this.metrics.apiRequest.shift()
      }

      if (duration > 3000) {
        console.warn(`API 请求耗时过长: ${url} (${duration}ms)`)
      }
    }
  }

  /**
   * 记录自定义指标
   */
  mark(name: string) {
    performance.mark(name)
  }

  /**
   * 测量两个标记之间的时间
   */
  measure(name: string, startMark: string, endMark?: string) {
    performance.measure(name, startMark, endMark)
    const entries = performance.getEntriesByName(name, 'measure')
    return entries[0]?.duration
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * 获取性能评分
   */
  getScore(): number {
    const scores: number[] = []

    // FCP 评分 (0-100)
    if (this.metrics.FCP) {
      scores.push(this.getMetricScore(this.metrics.FCP, 1800, 1000))
    }

    // LCP 评分 (0-100)
    if (this.metrics.LCP) {
      scores.push(this.getMetricScore(this.metrics.LCP, 2500, 1200))
    }

    // FID 评分 (0-100)
    if (this.metrics.FID) {
      scores.push(this.getMetricScore(this.metrics.FID, 300, 100))
    }

    // CLS 评分 (0-100)
    if (this.metrics.CLS !== undefined) {
      scores.push(this.getMetricScore(this.metrics.CLS, 0.25, 0.1))
    }

    // TTFB 评分 (0-100)
    if (this.metrics.TTFB) {
      scores.push(this.getMetricScore(this.metrics.TTFB, 800, 200))
    }

    if (scores.length === 0) return 0
    return Math.round(scores.reduce((a, b) => a + b) / scores.length)
  }

  /**
   * 单个指标评分
   */
  private getMetricScore(value: number, bad: number, good: number): number {
    if (value <= good) return 100
    if (value >= bad) return 0
    return Math.round(((bad - value) / (bad - good)) * 100)
  }

  /**
   * 获取性能报告
   */
  getReport(): string {
    const metrics = this.getMetrics()
    const score = this.getScore()

    let report = `📊 性能评分: ${score}/100\n\n`

    if (metrics.FCP) {
      report += `🎨 首次内容绘制 (FCP): ${metrics.FCP}ms\n`
    }
    if (metrics.LCP) {
      report += `🖼️ 最大内容绘制 (LCP): ${metrics.LCP}ms\n`
    }
    if (metrics.FID) {
      report += `⚡ 首次输入延迟 (FID): ${metrics.FID}ms\n`
    }
    if (metrics.CLS !== undefined) {
      report += `📐 累积布局偏移 (CLS): ${metrics.CLS}\n`
    }
    if (metrics.TTFB) {
      report += `⏱️ 首字节时间 (TTFB): ${metrics.TTFB}ms\n`
    }

    if (metrics.slowResources?.length) {
      report += `\n⚠️ 慢资源 (${metrics.slowResources.length}):\n`
      metrics.slowResources.slice(-5).forEach((res) => {
        report += `  - ${res.name}: ${Math.round(res.duration)}ms\n`
      })
    }

    if (metrics.longTasks?.length) {
      report += `\n⚠️ 长任务 (${metrics.longTasks.length}):\n`
      metrics.longTasks.slice(-5).forEach((task) => {
        report += `  - ${Math.round(task.duration)}ms\n`
      })
    }

    return report
  }

  /**
   * 清理
   */
  destroy() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }
}

export const performanceMonitor = new PerformanceMonitor()
export default performanceMonitor

/**
 * Vue Hook
 */
export function usePerformance() {
  onUnmounted(() => {
    // 如果需要，可以在组件卸载时清理
  })

  return {
    metrics: performanceMonitor.getMetrics(),
    score: performanceMonitor.getScore(),
    report: performanceMonitor.getReport(),
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureRoute: performanceMonitor.measureRouteChange.bind(performanceMonitor),
    measureApi: performanceMonitor.measureApiRequest.bind(performanceMonitor)
  }
}
