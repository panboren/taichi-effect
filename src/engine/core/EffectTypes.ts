/**
 * Taichi.js 特效引擎 - 大项目架构优化版
 * 设计原则：
 * 1. 模块化：每个特效独立模块，易于扩展和维护
 * 2. 可配置：支持动态参数调整和预设配置
 * 3. 性能优化：分层渲染、资源复用、GPU 内存管理
 * 4. 可观测性：完整的监控和调试能力
 * 5. 插件化：支持特效插件扩展
 */

// ============================================================================
// 类型定义层
// ============================================================================

/**
 * 特效类型枚举
 */
export enum EffectType {
  FRACTAL = 'fractal', // 分形
  PARTICLE = 'particle', // 粒子
  WAVE = 'wave', // 波浪
  FLUID = 'fluid', // 流体
  GALAXY = 'galaxy', // 星系
  NOISE = 'noise', // 噪声
  PLASMA = 'plasma', // 等离子
  FIRE = 'fire', // 火焰
  DUST = 'dust', // 粒尘（展示随机数功能）
  SMOKE = 'smoke', // 烟雾
  WATER = 'water', // 水波
  CUSTOM = 'custom', // 自定义
}

/**
 * 特效渲染质量
 */
export enum RenderQuality {
  LOW = 'low', // 低质量 (低分辨率)
  MEDIUM = 'medium', // 中质量
  HIGH = 'high', // 高质量
  ULTRA = 'ultra', // 超高质量 (支持 4K)
}

/**
 * 渲染后处理效果
 */
export enum PostProcessing {
  NONE = 'none', // 无后处理
  BLUR = 'blur', // 模糊
  SHARPEN = 'sharpen', // 锐化
  BLOOM = 'bloom', // 辉光
  VIGNETTE = 'vignette', // 晕影
  CHROMATIC = 'chromatic', // 色差
  FILM_GRAIN = 'filmGrain', // 胶片颗粒
}

/**
 * 特效元数据
 */
export interface EffectMetadata {
  /** 特效名称 */
  name: string
  /** 特效描述 */
  description: string
  /** 特效类型 */
  type: EffectType
  /** 创建时间 */
  createdAt: number
  /** 作者 */
  author?: string
  /** 版本 */
  version: string
  /** 标签 */
  tags: string[]
  /** 预览图 URL */
  preview?: string
  /** 性能评级 (1-10) */
  performanceRating: number
  /** GPU 内存占用 (MB) */
  gpuMemoryUsage?: number
}

/**
 * 特效参数定义
 */
export interface EffectParam {
  /** 参数名称 */
  name: string
  /** 参数值 */
  value: any
  /** 参数类型 */
  type: 'number' | 'boolean' | 'string' | 'color' | 'vector'
  /** 默认值 */
  default: any
  /** 最小值 (number 类型) */
  min?: number
  /** 最大值 (number 类型) */
  max?: number
  /** 步长 (number 类型) */
  step?: number
  /** 参数描述 */
  description?: string
  /** 是否可选 */
  optional?: boolean
}

/**
 * 特效配置接口
 */
export interface EffectConfig {
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
  /** 背景色 */
  backgroundColor?: string
  /** 目标 FPS */
  targetFps?: number
  /** 渲染质量 */
  quality?: RenderQuality
  /** 后处理效果 */
  postProcessing?: PostProcessing[]
  /** 自定义参数 */
  params?: Record<string, any>
  /** 是否启用性能监控 */
  enablePerformanceMonitor?: boolean
  /** 是否启用调试模式 */
  debugMode?: boolean
}

/**
 * 特效状态
 */
export interface EffectState {
  /** 是否运行中 */
  isRunning: boolean
  /** 当前特效 */
  currentEffect: EffectType
  /** 帧数 */
  frameCount: number
  /** 当前 FPS */
  fps: number
  /** 平均 FPS */
  avgFps: number
  /** 运行时间 (秒) */
  runTime: number
  /** GPU 内存使用 (MB) */
  gpuMemory: number
  /** 渲染质量 */
  quality: RenderQuality
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 当前 FPS */
  fps: number
  /** 平均 FPS */
  avgFps: number
  /** 最小 FPS */
  minFps: number
  /** 最大 FPS */
  maxFps: number
  /** 帧时间 (ms) */
  frameTime: number
  /** 平均帧时间 */
  avgFrameTime: number
  /** GPU 内存使用 (MB) */
  gpuMemory: number
  /** 渲染时间 (ms) */
  renderTime: number
  /** 总渲染时间 (ms) */
  totalRenderTime: number
}

/**
 * 引擎配置
 */
export interface EngineConfig {
  /** 默认宽度 */
  defaultWidth: number
  /** 默认高度 */
  defaultHeight: number
  /** 默认目标 FPS */
  defaultTargetFps: number
  /** 默认渲染质量 */
  defaultQuality: RenderQuality
  /** 是否启用自动质量调整 */
  autoQualityAdjustment: boolean
  /** 最低 FPS 阈值 */
  minFpsThreshold: number
  /** 是否启用性能监控 */
  enablePerformanceMonitor: boolean
  /** 是否启用调试日志 */
  enableDebugLog: boolean
}

// ============================================================================
// 基础接口和抽象类
// ============================================================================

/**
 * 特效基类接口
 * 所有特效实现必须实现此接口
 */
export interface IEffect {
  /**
   * 初始化特效
   */
  initialize(ti: any, width: number, height: number): Promise<void>

  /**
   * 创建渲染 kernel
   */
  createKernel(ti: any, pixels: any, params: Record<string, any>): any

  /**
   * 渲染一帧
   */
  render(time: number): void

  /**
   * 更新参数
   */
  updateParams(params: Record<string, any>): void

  /**
   * 获取参数定义
   */
  getParamDefs(): EffectParam[]

  /**
   * 获取元数据
   */
  getMetadata(): EffectMetadata

  /**
   * 销毁特效
   */
  destroy(): void
}

/**
 * 渲染器接口
 */
export interface IRenderer {
  /**
   * 渲染像素字段到画布
   */
  render(pixels: any, canvas: HTMLCanvasElement): void

  /**
   * 应用后处理效果
   */
  applyPostProcessing(pixels: any, effects: PostProcessing[]): void

  /**
   * 调整渲染质量
   */
  setQuality(quality: RenderQuality): void
}

/**
 * 性能监控器接口
 */
export interface IPerformanceMonitor {
  /**
   * 开始测量
   */
  startMeasure(): void

  /**
   * 结束测量
   */
  endMeasure(): number

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics

  /**
   * 重置指标
   */
  reset(): void

  /**
   * 导出报告
   */
  exportReport(): string
}

/**
 * 事件总线接口
 */
export interface IEventBus {
  /**
   * 订阅事件
   */
  on(event: string, callback: Function): void

  /**
   * 取消订阅
   */
  off(event: string, callback: Function): void

  /**
   * 发布事件
   */
  emit(event: string, data?: any): void

  /**
   * 只订阅一次
   */
  once(event: string, callback: Function): void

  /**
   * 清除所有事件监听
   */
  clear(): void
}

// ============================================================================
// 特效注册表
// ============================================================================

/**
 * 特效注册表
 * 管理所有可用特效的注册和获取
 */
export class EffectRegistry {
  private static instance: EffectRegistry
  private effects: Map<EffectType, IEffect> = new Map()
  private metadata: Map<EffectType, EffectMetadata> = new Map()

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): EffectRegistry {
    if (!EffectRegistry.instance) {
      EffectRegistry.instance = new EffectRegistry()
    }
    return EffectRegistry.instance
  }

  /**
   * 注册特效
   */
  registerEffect(type: EffectType, effect: IEffect, metadata?: EffectMetadata): void {
    this.effects.set(type, effect)
    if (metadata) {
      this.metadata.set(type, metadata)
    }
  }

  /**
   * 获取特效
   */
  getEffect(type: EffectType): IEffect | undefined {
    return this.effects.get(type)
  }

  /**
   * 获取特效元数据
   */
  getMetadata(type: EffectType): EffectMetadata | undefined {
    return this.metadata.get(type)
  }

  /**
   * 获取所有特效类型
   */
  getEffectTypes(): EffectType[] {
    return Array.from(this.effects.keys())
  }

  /**
   * 检查特效是否存在
   */
  hasEffect(type: EffectType): boolean {
    return this.effects.has(type)
  }

  /**
   * 注销特效
   */
  unregisterEffect(type: EffectType): void {
    const effect = this.effects.get(type)
    if (effect) {
      effect.destroy()
    }
    this.effects.delete(type)
    this.metadata.delete(type)
  }

  /**
   * 获取所有元数据
   */
  getAllMetadata(): EffectMetadata[] {
    return Array.from(this.metadata.values())
  }

  /**
   * 搜索特效
   */
  searchEffects(keyword: string): EffectType[] {
    return this.getAllMetadata()
      .filter(
        (meta) =>
          meta.name.toLowerCase().includes(keyword.toLowerCase()) ||
          meta.description.toLowerCase().includes(keyword.toLowerCase()) ||
          meta.tags.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase()))
      )
      .map((meta) => meta.type)
  }
}

// ============================================================================
// 配置管理器
// ============================================================================

/**
 * 配置管理器
 * 管理引擎的全局配置和预设配置
 */
export class ConfigManager {
  private config: EngineConfig
  private presets: Map<string, EffectConfig> = new Map()

  constructor(config?: Partial<EngineConfig>) {
    this.config = {
      defaultWidth: window.innerWidth,
      defaultHeight: window.innerHeight,
      defaultTargetFps: 60,
      defaultQuality: RenderQuality.HIGH,
      autoQualityAdjustment: true,
      minFpsThreshold: 30,
      enablePerformanceMonitor: true,
      enableDebugLog: false,
      ...config,
    }
  }

  /**
   * 获取配置
   */
  getConfig(): EngineConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 保存预设
   */
  savePreset(name: string, config: EffectConfig): void {
    this.presets.set(name, { ...config })
  }

  /**
   * 加载预设
   */
  loadPreset(name: string): EffectConfig | undefined {
    return this.presets.get(name)
  }

  /**
   * 删除预设
   */
  deletePreset(name: string): boolean {
    return this.presets.delete(name)
  }

  /**
   * 获取所有预设名称
   */
  getPresetNames(): string[] {
    return Array.from(this.presets.keys())
  }

  /**
   * 导出所有预设
   */
  exportPresets(): string {
    return JSON.stringify(Array.from(this.presets.entries()), null, 2)
  }

  /**
   * 导入预设
   */
  importPresets(json: string): void {
    const presets = JSON.parse(json)
    this.presets = new Map(presets)
  }
}

// ============================================================================
// 事件总线实现
// ============================================================================

/**
 * 事件总线实现
 */
export class EventBus implements IEventBus {
  private static instance: EventBus
  private callbacks: Map<string, Function[]> = new Map()

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event: string, data?: any): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  once(event: string, callback: Function): void {
    const wrappedCallback = (data?: any) => {
      callback(data)
      this.off(event, wrappedCallback)
    }
    this.on(event, wrappedCallback)
  }

  clear(): void {
    this.callbacks.clear()
  }
}

// ============================================================================
// 性能监控器实现
// ============================================================================

/**
 * 性能监控器实现
 */
export class PerformanceMonitor implements IPerformanceMonitor {
  private startTime: number = 0
  private frameTimes: number[] = []
  private fpsValues: number[] = []
  private renderTimes: number[] = []
  private totalRenderTime: number = 0
  private frameCount: number = 0
  private lastFrameTime: number = 0

  startMeasure(): void {
    this.startTime = performance.now()
  }

  endMeasure(): number {
    const endTime = performance.now()
    const duration = endTime - this.startTime

    this.frameTimes.push(duration)
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift()
    }

    return duration
  }

  recordRenderTime(time: number): void {
    this.renderTimes.push(time)
    this.totalRenderTime += time
    this.frameCount++

    if (this.renderTimes.length > 60) {
      this.renderTimes.shift()
    }

    // 计算 FPS
    const now = performance.now()
    if (this.lastFrameTime > 0) {
      const fps = 1000 / (now - this.lastFrameTime)
      this.fpsValues.push(fps)
      if (this.fpsValues.length > 60) {
        this.fpsValues.shift()
      }
    }
    this.lastFrameTime = now
  }

  getMetrics(): PerformanceMetrics {
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0

    const fps = this.fpsValues.length > 0
      ? this.fpsValues[this.fpsValues.length - 1]
      : 0

    const avgFps = this.fpsValues.length > 0
      ? this.fpsValues.reduce((a, b) => a + b, 0) / this.fpsValues.length
      : 0

    return {
      fps,
      avgFps,
      minFps: Math.min(...this.fpsValues, 0),
      maxFps: Math.max(...this.fpsValues, 0),
      frameTime: this.frameTimes[this.frameTimes.length - 1] || 0,
      avgFrameTime,
      gpuMemory: 0, // Taichi.js 暂不支持获取 GPU 内存
      renderTime: this.renderTimes[this.renderTimes.length - 1] || 0,
      totalRenderTime: this.totalRenderTime,
    }
  }

  reset(): void {
    this.frameTimes = []
    this.fpsValues = []
    this.renderTimes = []
    this.totalRenderTime = 0
    this.frameCount = 0
    this.lastFrameTime = 0
  }

  exportReport(): string {
    const metrics = this.getMetrics()
    return JSON.stringify(metrics, null, 2)
  }
}

// ============================================================================
// 导出 (所有类已在定义时导出)
// ============================================================================
