/**
 * Taichi.js 特效引擎
 * 基于 taichi.js 的 GPU 计算能力构建高性能视觉效果引擎
 */

import * as ti from 'taichi.js'
import { ElMessage } from 'element-plus'

// 特效类型定义
export type EffectType =
  | 'fractal'
  | 'particle'
  | 'wave'
  | 'fluid'
  | 'galaxy'
  | 'noise'
  | 'custom'

// 特效配置接口
export interface EffectConfig {
  width: number
  height: number
  backgroundColor?: string
  fps?: number
  params?: Record<string, any>
}

// 特效状态
export interface EffectState {
  isRunning: boolean
  currentEffect: EffectType
  frameCount: number
  fps: number
}

export class TaichiEffectEngine {
  private canvas: HTMLCanvasElement | null = null
  private tiCanvas: any = null
  private width: number
  private height: number
  private isInitialized: boolean = false
  private currentEffect: EffectType = 'fractal'
  private animationId: number | null = null
  private lastTime: number = 0
  private frameCount: number = 0

  // Taichi 字段
  private pixels: any = null
  private kernel: any = null

  // 特效参数
  private effectParams: Record<string, any> = {}

  // 事件回调
  private callbacks: Map<string, Function[]> = new Map()

  constructor(config: EffectConfig) {
    this.width = config.width || window.innerWidth
    this.height = config.height || window.innerHeight
    this.effectParams = config.params || {}
  }

  /**
   * 初始化引擎
   */
  async init(canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      this.canvas = canvas
      canvas.width = this.width
      canvas.height = this.height

      // 初始化 taichi.js
      await ti.init()

      // 创建像素字段
      this.pixels = ti.Vector.field(4, ti.f32, [this.width, this.height])

      // 创建画布
      this.tiCanvas = new ti.Canvas(canvas)

      this.isInitialized = true
      this.emit('initialized', this)
      ElMessage.success('Taichi.js 特效引擎初始化成功')

      return true
    } catch (error) {
      console.error('初始化失败:', error)
      ElMessage.error('初始化失败: ' + (error as Error).message)
      return false
    }
  }

  /**
   * 切换特效
   */
  async switchEffect(effectType: EffectType): Promise<void> {
    if (!this.isInitialized) {
      ElMessage.error('引擎未初始化')
      return
    }

    // 停止当前动画
    this.stop()

    this.currentEffect = effectType
    this.frameCount = 0

    // 根据类型创建不同的 kernel
    await this.createKernel(effectType)

    this.emit('effectChanged', { effectType, engine: this })
  }

  /**
   * 创建 kernel
   */
  private async createKernel(effectType: EffectType): Promise<void> {
    switch (effectType) {
      case 'fractal':
        this.createFractalKernel()
        break
      case 'particle':
        this.createParticleKernel()
        break
      case 'wave':
        this.createWaveKernel()
        break
      case 'fluid':
        this.createFluidKernel()
        break
      case 'galaxy':
        this.createGalaxyKernel()
        break
      case 'noise':
        this.createNoiseKernel()
        break
      default:
        this.createFractalKernel()
    }
  }

  /**
   * 分形特效 - Julia Set
   */
  private createFractalKernel(): void {
    const width = this.width
    const height = this.height

    ti.addToKernelScope({
      pixels: this.pixels,
      width,
      height,
    })

    this.kernel = ti.kernel((t: any) => {
      for (let I of ti.ndrange(width, height)) {
        const i = I[0]
        const j = I[1]

        const c = [-0.8, ti.cos(t) * 0.2]
        const z = [(i / width - 0.5) * 3, (j / height - 0.5) * 3]
        let iterations = 0
        while (z.norm() < 20 && iterations < 50) {
          z[0] = z[0] * z[0] - z[1] * z[1] + c[0]
          z[1] = z[1] * z[0] * 2 + c[1]
          iterations = iterations + 1
        }
        pixels[(i, j)] = [1 - iterations * 0.02, 0, 0, 1]
        pixels[(i, j)][1] = pixels[(i, j)][0] * 0.8
        pixels[(i, j)][2] = pixels[(i, j)][0] * 0.6
      }
    })
  }

  /**
   * 粒子特效
   */
  private createParticleKernel(): void {
    const width = this.width
    const height = this.height

    ti.addToKernelScope({
      pixels: this.pixels,
      width,
      height,
    })

    this.kernel = ti.kernel((t: any) => {
      for (let I of ti.ndrange(width, height)) {
        const i = I[0]
        const j = I[1]

        const x = i - width / 2
        const y = j - height / 2

        const angle = t * 0.5
        const radius = 150
        const px = ti.cos(angle) * radius
        const py = ti.sin(angle) * radius

        const dx = x - px
        const dy = y - py
        const d = ti.sqrt(dx * dx + dy * dy)

        // 使用浮点运算初始化确保类型正确
        let intensity = d * 0
        if (d < 50) {
          intensity = (50 - d) / 50
        }

        pixels[(i, j)] = [intensity * 0.8, intensity * 0.4, intensity, 1]
      }
    })
  }

  /**
   * 波浪特效
   */
  private createWaveKernel(): void {
    const width = this.width
    const height = this.height

    ti.addToKernelScope({
      pixels: this.pixels,
      width,
      height,
    })

    this.kernel = ti.kernel((t: any) => {
      for (let I of ti.ndrange(width, height)) {
        const i = I[0]
        const j = I[1]

        const x = i / width
        const y = j / height

        const wave1 = ti.sin(x * 10 + t * 2) * 0.5 + 0.5
        const wave2 = ti.sin(y * 10 + t * 3) * 0.5 + 0.5
        const wave3 = ti.sin((x + y) * 5 + t * 4) * 0.5 + 0.5

        const value = (wave1 + wave2 + wave3) / 3

        pixels[(i, j)] = [value * 0.2, value * 0.6, value, 1]
      }
    })
  }

  /**
   * 流体特效 (简化版)
   */
  private createFluidKernel(): void {
    const width = this.width
    const height = this.height

    ti.addToKernelScope({
      pixels: this.pixels,
      width,
      height,
    })

    this.kernel = ti.kernel((t: any) => {
      for (let I of ti.ndrange(width, height)) {
        const i = I[0]
        const j = I[1]

        const x = i / width - 0.5
        const y = j / height - 0.5

        const angle = ti.atan2(y, x)
        const radius = ti.sqrt(x * x + y * y)

        const turbulence = ti.sin(radius * 20 - t * 3 + angle * 5)
        const value = (turbulence + 1) * 0.5

        const r = ti.sin(value * 6.28) * 0.5 + 0.5
        const g = ti.cos(value * 6.28 + 1) * 0.5 + 0.5
        const b = ti.sin(value * 6.28 + 2) * 0.5 + 0.5

        pixels[(i, j)] = [r, g, b, 1]
      }
    })
  }

  /**
   * 星系特效 - 重新设计
   */
  private createGalaxyKernel(): void {
    const width = this.width
    const height = this.height

    ti.addToKernelScope({
      pixels: this.pixels,
      width,
      height,
    })

    this.kernel = ti.kernel((t: any) => {
      for (let I of ti.ndrange(width, height)) {
        const i = I[0]
        const j = I[1]

        const x = i - width / 2
        const y = j - height / 2
        const distFromCenter = ti.sqrt(x * x + y * y)

        // 创建螺旋星系效果
        const angle = ti.atan2(y, x)
        const spiral = angle + t * 0.3 + distFromCenter * 0.01

        // 基于距离的颜色
        const brightness = ti.max(0, 1 - distFromCenter / 300)

        // 基于角度的颜色变化
        const r = brightness * (ti.sin(spiral) * 0.5 + 0.5)
        const g = brightness * (ti.sin(spiral + 2.1) * 0.5 + 0.5)
        const b = brightness * (ti.sin(spiral + 4.2) * 0.5 + 0.5)

        pixels[(i, j)] = [r, g, b, 1]
      }
    })
  }

  /**
   * 噪声特效
   */
  private createNoiseKernel(): void {
    const width = this.width
    const height = this.height

    ti.addToKernelScope({
      pixels: this.pixels,
      width,
      height,
    })

    this.kernel = ti.kernel((t: any) => {
      for (let I of ti.ndrange(width, height)) {
        const i = I[0]
        const j = I[1]

        const scale = 50
        const x = i / scale
        const y = j / scale

        let noise = ti.sin(x + t) * ti.cos(y + t * 0.5)
        noise = noise + ti.sin(x * 2 + t * 1.5) * ti.cos(y * 2 + t * 0.8) * 0.5
        noise = noise + ti.sin(x * 4 + t * 2) * ti.cos(y * 4 + t * 1.2) * 0.25

        const value = (noise + 1.75) / 3.5

        pixels[(i, j)] = [value, value * 0.8, value * 0.6, 1]
      }
    })
  }

  /**
   * 开始动画
   */
  start(): void {
    if (!this.isInitialized || this.animationId !== null) {
      return
    }

    this.lastTime = performance.now()
    this.frameCount = 0

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - this.lastTime) / 1000
      this.lastTime = currentTime
      this.frameCount++

      // 执行 kernel
      if (this.kernel) {
        this.kernel(deltaTime)
        this.tiCanvas.setImage(this.pixels)
      }

      // 计算 FPS
      if (this.frameCount % 30 === 0) {
        const fps = Math.round(1 / deltaTime)
        this.emit('fpsUpdate', fps)
      }

      this.animationId = requestAnimationFrame(animate)
    }

    this.animationId = requestAnimationFrame(animate)
    this.emit('started', this)
  }

  /**
   * 停止动画
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
      this.emit('stopped', this)
    }
  }

  /**
   * 重置
   */
  reset(): void {
    this.stop()
    this.frameCount = 0
    this.effectParams = {}
    this.emit('reset', this)
  }

  /**
   * 更新参数
   */
  updateParams(params: Record<string, any>): void {
    this.effectParams = { ...this.effectParams, ...params }
    this.emit('paramsUpdated', this.effectParams)
  }

  /**
   * 调整画布大小
   */
  resize(width: number, height: number): void {
    this.width = width
    this.height = height

    if (this.canvas) {
      this.canvas.width = width
      this.canvas.height = height
    }

    // 重新创建像素字段
    this.pixels = ti.Vector.field(4, ti.f32, [width, height])

    // 重新创建 kernel
    this.createKernel(this.currentEffect)

    this.emit('resized', { width, height })
  }

  /**
   * 获取当前状态
   */
  getState(): EffectState {
    return {
      isRunning: this.animationId !== null,
      currentEffect: this.currentEffect,
      frameCount: this.frameCount,
      fps: 0,
    }
  }

  /**
   * 事件监听
   */
  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: Function): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.stop()
    this.callbacks.clear()
    this.isInitialized = false
    this.emit('destroyed', this)
  }
}
