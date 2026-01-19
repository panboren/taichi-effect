/**
 * Taichi.js 特效引擎 - 核心引擎类
 * 大项目架构优化版 - 可扩展、高性能、易维护
 */

import * as ti from 'taichi.js'
import { ElMessage } from 'element-plus'
import {
  EffectType,
  RenderQuality,
  PostProcessing,
} from './EffectTypes'
import type {
  IEffect,
  IRenderer,
  IPerformanceMonitor,
  IEventBus,
  EffectConfig,
  EffectState,
  PerformanceMetrics,
} from './EffectTypes'
import {
  EffectRegistry,
  ConfigManager,
  EventBus,
  PerformanceMonitor,
} from './EffectTypes'
import { FractalEffect } from '../effects/FractalEffect'
import { ParticleEffect } from '../effects/ParticleEffect'
import { WaveEffect } from '../effects/WaveEffect'
import { FluidEffect } from '../effects/FluidEffect'
import { GalaxyEffect } from '../effects/GalaxyEffect'
import { NoiseEffect } from '../effects/NoiseEffect'
import { PlasmaEffect } from '../effects/PlasmaEffect'
import { FireEffect } from '../effects/FireEffect'
import { DustEffect } from '../effects/DustEffect'
import { DefaultRenderer } from './DefaultRenderer'
import { KernelCache } from './KernelCache'
import { MemoryPool } from './MemoryPool'

// ============================================================================
// 引擎配置
// ============================================================================

/**
 * 引擎配置
 */
export interface TaichiEngineConfig {
  /** 默认宽度 */
  defaultWidth?: number
  /** 默认高度 */
  defaultHeight?: number
  /** 目标 FPS */
  targetFps?: number
  /** 默认渲染质量 */
  defaultQuality?: RenderQuality
  /** 是否启用性能监控 */
  enablePerformanceMonitor?: boolean
  /** 是否启用调试模式 */
  debugMode?: boolean
  /** 是否启用自动质量调整 */
  autoQualityAdjustment?: boolean
  /** 最低 FPS 阈值 */
  minFpsThreshold?: number
}

// ============================================================================
// 核心引擎类
// ============================================================================

/**
 * Taichi.js 特效引擎
 *
 * 核心功能:
 * - 管理 Taichi.js 初始化和生命周期
 * - 特效切换和参数管理
 * - 渲染循环和性能优化
 * - 事件系统和状态管理
 * - 性能监控和自适应质量调整
 */
export class TaichiEffectEngine {
  // 核心属性
  private canvas: HTMLCanvasElement | null = null
  private tiCanvas: any = null
  private pixels: any = null
  private kernel: any = null

  // 尺寸
  private width: number
  private height: number

  // 状态
  private isInitialized: boolean = false
  private isRunning: boolean = false
  private currentEffect: IEffect | null = null
  private effectType: EffectType = EffectType.FRACTAL

  // 动画
  private animationId: number | null = null
  private lastTime: number = 0
  private frameCount: number = 0
  private startTime: number = 0

  // 性能
  private targetFps: number
  private quality: RenderQuality
  private performanceMonitor: IPerformanceMonitor

  // 组件
  private renderer: IRenderer
  private eventBus: IEventBus
  private configManager: ConfigManager
  private effectRegistry: EffectRegistry

  // 特效参数
  private effectParams: Record<string, any> = {}

  // 配置
  private debugMode: boolean
  private autoQualityAdjustment: boolean
  private minFpsThreshold: number

  // 后处理效果
  private postProcessing: PostProcessing[] = []

  // 优化组件
  private kernelCache: KernelCache
  private memoryPool: MemoryPool

  // 性能配置
  private enableKernelCache: boolean = true
  private enableMemoryPool: boolean = true

  // ============================================================================
  // 构造函数和初始化
  // ============================================================================

  constructor(config: TaichiEngineConfig = {}) {
    this.width = config.defaultWidth || window.innerWidth
    this.height = config.defaultHeight || window.innerHeight
    this.targetFps = config.targetFps || 60
    this.quality = config.defaultQuality || RenderQuality.HIGH
    this.debugMode = config.debugMode || false
    this.autoQualityAdjustment = config.autoQualityAdjustment ?? true
    this.minFpsThreshold = config.minFpsThreshold || 30

    // 初始化组件
    this.performanceMonitor = new PerformanceMonitor()
    this.renderer = new DefaultRenderer()
    this.eventBus = EventBus.getInstance()
    this.configManager = new ConfigManager()
    this.effectRegistry = EffectRegistry.getInstance()

    // 初始化优化组件
    this.kernelCache = KernelCache.getInstance()
    this.memoryPool = MemoryPool.getInstance()

    // 注册内置特效
    this.registerBuiltInEffects()

    this.debugLog('Engine constructed')
  }

  /**
   * 初始化引擎
   */
  async init(canvas: HTMLCanvasElement, config?: EffectConfig): Promise<boolean> {
    try {
      console.log('[INIT] ==========================================')
      console.log('[INIT] Engine initialization started')
      this.debugLog('Initializing engine...')

      // 等待画布在 DOM 中就绪
      const maxWait = 100
      let waitCount = 0
      while (!document.body.contains(canvas) && waitCount < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 10))
        waitCount++
      }
      console.log('[INIT] Canvas wait count:', waitCount)

      if (!document.body.contains(canvas)) {
        console.error('[INIT] ERROR: Canvas not in DOM')
        ElMessage.error('画布元素未在 DOM 中找到')
        return false
      }

      console.log('[INIT] Original canvas:', {
        id: canvas.id,
        className: canvas.className,
        width: canvas.width,
        height: canvas.height,
        inDOM: document.body.contains(canvas),
        parentElement: canvas.parentElement?.tagName
      })

      // 创建一个新的画布元素来替换旧的（确保没有上下文占用）
      console.log('[INIT] Creating new canvas element...')
      const newCanvas = document.createElement('canvas')
      newCanvas.id = canvas.id
      newCanvas.width = this.width
      newCanvas.height = this.height

      console.log('[INIT] New canvas created:', {
        id: newCanvas.id,
        width: newCanvas.width,
        height: newCanvas.height
      })

      // 复制样式
      const computedStyle = window.getComputedStyle(canvas)
      newCanvas.style.cssText = computedStyle.cssText

      console.log('[INIT] Styles copied from original canvas')

      // 替换画布
      console.log('[INIT] Replacing original canvas with new one...')
      canvas.parentNode?.replaceChild(newCanvas, canvas)
      this.canvas = newCanvas

      console.log('[INIT] Canvas replaced successfully')
      this.debugLog(`Replaced canvas, new size: ${this.width}x${this.height}`)

      console.log('[INIT] ==========================================')
      console.log('[INIT] After canvas replacement:')
      console.log('[INIT]   Canvas width:', newCanvas.width)
      console.log('[INIT]   Canvas height:', newCanvas.height)
      console.log('[INIT]   Canvas in DOM:', document.body.contains(newCanvas))
      console.log('[INIT] ==========================================')
      console.log('[INIT] About to get WebGPU context...')

      // 初始化 Taichi.js - 使用调试选项（可优化为生产环境关闭）
      this.debugLog('Initializing Taichi.js...')
      console.log('[INIT] Starting taichi.js initialization...')
      try {
        console.log('[INIT] Calling ti.init() with options:', {
          printIR: this.debugMode,
          printWGSL: this.debugMode
        })
        await ti.init({
          printIR: this.debugMode,
          printWGSL: this.debugMode,
        })
        console.log('[INIT] taichi.js initialized successfully ✓')
        this.debugLog('Taichi.js initialized successfully')

        // 添加常用数学常量和函数到 kernel scope
        console.log('[INIT] Setting up kernel scope...')
        this.setupKernelScope()
        console.log('[INIT] Kernel scope setup complete ✓')
      } catch (error) {
        console.error('[INIT] ERROR: Failed to initialize taichi.js')
        console.error('[INIT] Error details:', error)
        const errorMsg = (error as Error).message || 'Unknown error'

        if (errorMsg.includes('WebGPU') || errorMsg.includes('GPU')) {
          ElMessage.error({
            message: 'WebGPU 初始化失败。taichi.js 需要 WebGPU 支持。',
            duration: 10000,
            type: 'error',
            showClose: true,
          })
          console.error('WebGPU Initialization Error:', errorMsg)
          console.error('建议：')
          console.error('1. 访问 chrome://flags (Chrome/Edge)')
          console.error('2. 搜索 "WebGPU"')
          console.error('3. 启用所有 WebGPU 选项')
          console.error('4. 点击 Relaunch 重启浏览器')
        } else {
          ElMessage.error(`Taichi.js 初始化失败: ${errorMsg}`)
        }
        return false
      }

      // 创建 Taichi Canvas
      this.debugLog('Creating Taichi canvas...')
      console.log('[INIT] ==========================================')
      console.log('[INIT] Step 1: Creating Taichi canvas...')
      console.log('[INIT] Step 2: Checking canvas dimensions...')
      try {
        // 确保画布尺寸已设置
        if (newCanvas.width === 0 || newCanvas.height === 0) {
          console.error('[INIT] ERROR: Canvas has zero dimensions')
          ElMessage.error('画布尺寸无效')
          return false
        }

        console.log('[INIT] Canvas dimensions valid:', newCanvas.width, 'x', newCanvas.height)
        console.log('[INIT] Step 3: About to call canvas.getContext("webgpu")...')

        // 直接尝试获取 WebGPU context（不要先获取其他上下文！）
        console.log('[INIT] Calling newCanvas.getContext("webgpu")...')
        const webgpuContext = newCanvas.getContext('webgpu')
        console.log('[INIT] ==========================================')
        console.log('[INIT] WebGPU context result:', webgpuContext ? 'AVAILABLE ✓' : 'NULL ✗')
        console.log('[INIT] ==========================================')


        if (!webgpuContext) {
          console.log('[INIT] ==========================================')
          console.log('[INIT] WebGPU context is NULL! Running diagnostics...')
          console.log('[INIT] ==========================================')

          // 创建一个新的诊断画布来测试
          console.log('[INIT] Creating test canvas...')
          const testCanvas = document.createElement('canvas')
          testCanvas.width = 100
          testCanvas.height = 100
          console.log('[INIT] Calling testCanvas.getContext("webgpu")...')
          const testContext = testCanvas.getContext('webgpu')
          console.log('[INIT] Test canvas WebGPU context:', testContext ? 'AVAILABLE ✓' : 'NULL ✗')

          console.log('[INIT] ==========================================')
          console.log('[INIT] Browser diagnostics:')
          console.log('[INIT]   User agent:', navigator.userAgent)
          console.log('[INIT]   navigator.gpu:', !!navigator.gpu)
          console.log('[INIT]   Original canvas WebGPU context:', webgpuContext ? 'Available' : 'NULL')
          console.log('[INIT]   Test canvas WebGPU context:', testContext ? 'Available' : 'NULL')
          console.log('[INIT] ==========================================')

          const diagnostics = [
            '无法获取 WebGPU Canvas 上下文',
            '',
            '诊断信息：',
            `- 浏览器版本: ${navigator.userAgent}`,
            `- navigator.gpu: ${!!navigator.gpu}`,
            `- 原始画布 WebGPU 上下文: ${webgpuContext ? '可用' : '不可用'}`,
            `- 测试画布 WebGPU 上下文: ${testContext ? '可用' : '不可用'}`,
            '',
            '问题分析：',
            '测试画布可以获取 WebGPU 上下文，说明浏览器支持 WebGPU。',
            '但原始画布无法获取，说明原始画布已被其他上下文占用。',
            '',
            '解决方案：',
            '代码已经尝试替换画布元素，如果仍然失败，请：',
            '1. 硬刷新页面 (Ctrl + Shift + R)',
            '2. 清除浏览器缓存',
            '3. 尝试无痕模式'
          ]

          console.log('[INIT] Showing error dialog...')
          ElMessageBox.alert(diagnostics.join('\n'), 'WebGPU 上下文创建失败', {
            confirmButtonText: '知道了',
            type: 'error',
            dangerouslyUseHTMLString: false,
          })
          console.log('[INIT] Returning false from init()')
          return false
        }

        console.log('[INIT] Step 4: Creating new ti.Canvas(newCanvas)...')
        console.log('[INIT] Calling: new ti.Canvas(canvasElement)')
        this.tiCanvas = new ti.Canvas(newCanvas)
        console.log('[INIT] ti.Canvas created successfully ✓')
        console.log('[INIT] ti.Canvas object:', this.tiCanvas)
        this.debugLog('Created Taichi canvas successfully')
      } catch (error) {
        console.error('Failed to create Taichi canvas:', error)
        console.error('Error stack:', (error as Error).stack)
        const errorMsg = (error as Error).message || 'Unknown error'

        if (errorMsg.includes('webgpu') || errorMsg.includes('GPUCanvasContext') || errorMsg.includes('context')) {
          ElMessage.error({
            message: '创建 WebGPU Canvas 失败。您的浏览器虽然报告支持 WebGPU，但底层驱动或硬件不支持。',
            duration: 12000,
            type: 'error',
            showClose: true,
          })
          console.error('Canvas Creation Error:', errorMsg)
          console.error('建议：')
          console.error('1. 更新显卡驱动到最新版本')
          console.error('2. Chrome: 设置 -> 系统 -> 禁用硬件加速 -> 重启')
          console.error('3. 检查是否有虚拟机或远程桌面环境')
          console.error('4. 访问 chrome://flags 启用所有 WebGPU 相关选项')
          console.error('5. 尝试无痕模式或重启浏览器')
        } else {
          ElMessage.error(`创建画布失败: ${errorMsg}`)
        }
        return false
      }

      // 创建像素字段（使用内存池）
      console.log('[INIT] Step 5: Creating pixel field...')
      if (this.enableMemoryPool) {
        console.log('[INIT] Acquiring pixel field from memory pool...')
        this.pixels = this.memoryPool.acquire(this.width, this.height)
        this.debugLog(`Acquired pixel field from pool: ${this.width}x${this.height}`)
      } else {
        console.log('[INIT] Creating new pixel field with ti.Vector.field()...')
        this.pixels = ti.Vector.field(4, ti.f32, [this.width, this.height])
        this.debugLog(`Created pixel field: ${this.width}x${this.height}`)
      }
      console.log('[INIT] Pixel field created ✓')

      // 应用配置
      console.log('[INIT] Step 6: Applying configuration...')
      if (config) {
        if (config.quality) {
          this.quality = config.quality
          this.renderer.setQuality(config.quality)
          console.log('[INIT] Quality set to:', config.quality)
        }
        if (config.postProcessing) {
          this.postProcessing = config.postProcessing
          console.log('[INIT] Post-processing effects set:', config.postProcessing)
        }
        if (config.params) {
          this.effectParams = config.params
          console.log('[INIT] Effect params set:', config.params)
        }
      }
      console.log('[INIT] Configuration applied ✓')

      // 初始化默认特效
      console.log('[INIT] Step 7: Initializing default effect...')

      // 先标记为已初始化，以便 switchEffect 可以正常工作
      this.isInitialized = true
      this.startTime = Date.now()
      this.lastTime = performance.now()

      console.log('[INIT] Calling switchEffect(EffectType.FRACTAL)...')
      await this.switchEffect(EffectType.FRACTAL)
      console.log('[INIT] Default effect initialized ✓')

      console.log('[INIT] Step 8: Emitting initialized event...')
      this.eventBus.emit('initialized', { engine: this })

      console.log('[INIT] ==========================================')
      console.log('[INIT] ✅ ENGINE INITIALIZATION COMPLETE ✅')
      console.log('[INIT] ==========================================')
      ElMessage.success('Taichi.js 特效引擎初始化成功')

      this.debugLog('Engine initialized successfully')
      console.log('[INIT] Returning true from init()')
      return true
    } catch (error) {
      console.log('[INIT] ==========================================')
      console.log('[INIT] ❌ INITIALIZATION FAILED ❌')
      console.log('[INIT] Error:', error)
      console.log('[INIT] Error message:', (error as Error).message)
      console.log('[INIT] Error stack:', (error as Error).stack)
      console.log('[INIT] ==========================================')
      console.error('Initialization failed:', error)
      ElMessage.error('初始化失败: ' + (error as Error).message)
      return false
    }
  }

  /**
   * 设置 kernel scope 常量和函数
   * 基于 taichi.js 最佳实践，将常用数学常量注入 kernel scope
   */
  private setupKernelScope(): void {
    ti.addToKernelScope({
      // 数学常量
      PI: Math.PI,
      PI2: Math.PI * 2,
      E: Math.E,
      SQRT2: Math.SQRT2,
      GOLDEN_RATIO: (1 + Math.sqrt(5)) / 2,

      // 常用数学函数（编译时求值）
      degToRad: (deg: number) => deg * (Math.PI / 180),
      radToDeg: (rad: number) => rad * (180 / Math.PI),
      lerp: (a: number, b: number, t: number) => a + (b - a) * t,
      clamp: (x: number, min: number, max: number) => Math.max(min, Math.min(max, x)),
      smoothstep: (edge0: number, edge1: number, x: number) => {
        const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
        return t * t * (3 - 2 * t)
      },
      fract: (x: number) => x - Math.floor(x),
    })

    this.debugLog('Kernel scope configured with math constants and functions')
  }

  /**
   * 注册内置特效
   */
  private registerBuiltInEffects(): void {
    const registry = EffectRegistry.getInstance()

    // 分形特效
    registry.registerEffect(EffectType.FRACTAL, new FractalEffect(), {
      name: '分形',
      description: 'Julia Set 分形特效，基于复数迭代',
      type: EffectType.FRACTAL,
      createdAt: Date.now(),
      version: '1.0.0',
      tags: ['fractal', 'julia', 'math'],
      performanceRating: 8,
    })

    // 粒子特效
    registry.registerEffect(EffectType.PARTICLE, new ParticleEffect(), {
      name: '粒子',
      description: '动态粒子系统特效',
      type: EffectType.PARTICLE,
      createdAt: Date.now(),
      version: '1.0.0',
      tags: ['particle', 'animation', 'dynamic'],
      performanceRating: 7,
    })

    // 波浪特效
    registry.registerEffect(EffectType.WAVE, new WaveEffect(), {
      name: '波浪',
      description: '多层正弦波叠加特效',
      type: EffectType.WAVE,
      createdAt: Date.now(),
      version: '1.0.0',
      tags: ['wave', 'sine', 'fluid'],
      performanceRating: 9,
    })

    // 流体特效
    registry.registerEffect(EffectType.FLUID, new FluidEffect(), {
      name: '流体',
      description: '湍流噪声流体特效',
      type: EffectType.FLUID,
      createdAt: Date.now(),
      version: '1.0.0',
      tags: ['fluid', 'noise', 'turbulence'],
      performanceRating: 6,
    })

    // 星系特效
    registry.registerEffect(EffectType.GALAXY, new GalaxyEffect(), {
      name: '星系',
      description: '螺旋星系特效',
      type: EffectType.GALAXY,
      createdAt: Date.now(),
      version: '1.0.0',
      tags: ['galaxy', 'spiral', 'space'],
      performanceRating: 7,
    })

    // 噪声特效
    registry.registerEffect(EffectType.NOISE, new NoiseEffect(), {
      name: '噪声',
      description: '多层噪声合成特效',
      type: EffectType.NOISE,
      createdAt: Date.now(),
      version: '1.0.0',
      tags: ['noise', 'texture', 'pattern'],
      performanceRating: 9,
    })

    // 等离子特效
    registry.registerEffect(EffectType.PLASMA, new PlasmaEffect(), {
      name: '等离子',
      description: '多层正弦波叠加的等离子效果',
      type: EffectType.PLASMA,
      createdAt: Date.now(),
      version: '1.0.0',
      tags: ['plasma', 'sine', 'layered', 'colorful'],
      performanceRating: 9,
    })

    // 火焰特效
    registry.registerEffect(EffectType.FIRE, new FireEffect(), {
      name: '火焰',
      description: '基于噪声的火焰模拟',
      type: EffectType.FIRE,
      createdAt: Date.now(),
      version: '1.0.0',
      tags: ['fire', 'flame', 'noise', 'turbulence'],
      performanceRating: 7,
    })

    // 粒尘特效
    registry.registerEffect(EffectType.DUST, new DustEffect(), {
      name: '粒尘',
      description: '使用随机数生成的漂浮粒尘特效',
      type: EffectType.DUST,
      createdAt: Date.now(),
      version: '1.0.0',
      tags: ['dust', 'particles', 'random', 'ambient'],
      performanceRating: 8,
    })
  }

  // ============================================================================
  // 特效管理
  // ============================================================================

  /**
   * 切换特效
   */
  async switchEffect(effectType: EffectType): Promise<void> {
    if (!this.isInitialized) {
      ElMessage.error('引擎未初始化')
      return
    }

    this.debugLog(`Switching to effect: ${effectType}`)

    // 停止当前动画
    this.stop()

    // 清理旧特效
    if (this.currentEffect) {
      this.currentEffect.destroy()
    }

    // 获取新特效
    const effect = this.effectRegistry.getEffect(effectType)
    if (!effect) {
      ElMessage.error(`特效不存在: ${effectType}`)
      return
    }

    // 初始化新特效
    try {
      await effect.initialize(ti, this.width, this.height)

      // 创建 kernel（使用缓存）
      if (this.enableKernelCache) {
        const cachedKernel = this.kernelCache.get(effectType, this.effectParams)
        if (cachedKernel) {
          this.kernel = cachedKernel
          this.debugLog(`Using cached kernel for: ${effectType}`)
        } else {
          this.kernel = effect.createKernel(ti, this.pixels, this.effectParams)
          this.kernelCache.set(effectType, this.effectParams, this.kernel)
          this.debugLog(`Created and cached kernel for: ${effectType}`)
        }
      } else {
        this.kernel = effect.createKernel(ti, this.pixels, this.effectParams)
      }

      this.currentEffect = effect
      this.effectType = effectType
      this.frameCount = 0

      this.debugLog(`Effect switched: ${effectType}`)
      this.eventBus.emit('effectChanged', {
        effectType,
        effect,
        engine: this,
      })
    } catch (error) {
      console.error('Switch effect failed:', error)
      ElMessage.error('切换特效失败')
    }
  }

  /**
   * 更新特效参数
   */
  updateParams(params: Record<string, any>): void {
    this.effectParams = { ...this.effectParams, ...params }

    // 如果当前特效存在，更新参数并重新创建 kernel
    if (this.currentEffect) {
      this.currentEffect.updateParams(params)

      // 重新创建 kernel 以应用新参数
      if (this.isInitialized) {
        this.kernel = this.currentEffect.createKernel(ti, this.pixels, this.effectParams)
      }
    }

    this.eventBus.emit('paramsUpdated', this.effectParams)
    this.debugLog('Params updated:', params)
  }

  /**
   * 获取特效参数定义
   */
  getParamDefs(): any[] {
    if (!this.currentEffect) {
      return []
    }
    return this.currentEffect.getParamDefs()
  }

  /**
   * 获取可用特效列表
   */
  getAvailableEffects(): EffectType[] {
    return this.effectRegistry.getEffectTypes()
  }

  // ============================================================================
  // 渲染控制
  // ============================================================================

  /**
   * 开始动画
   */
  start(): void {
    if (!this.isInitialized) {
      ElMessage.error('引擎未初始化')
      return
    }

    if (this.isRunning || this.animationId !== null) {
      this.debugLog('Animation already running')
      return
    }

    this.debugLog('Starting animation...')

    this.isRunning = true
    this.lastTime = performance.now()
    this.frameCount = 0

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - this.lastTime) / 1000
      this.lastTime = currentTime

      this.render(deltaTime)

      this.animationId = requestAnimationFrame(animate)
    }

    this.animationId = requestAnimationFrame(animate)
    this.eventBus.emit('started', { engine: this })
  }

  /**
   * 停止动画
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
      this.isRunning = false
      this.eventBus.emit('stopped', { engine: this })
      this.debugLog('Animation stopped')
    }
  }

  /**
   * 重置引擎
   */
  reset(): void {
    this.stop()
    this.frameCount = 0
    this.effectParams = {}
    this.performanceMonitor.reset()
    this.eventBus.emit('reset', { engine: this })
    this.debugLog('Engine reset')
  }

  /**
   * 渲染一帧
   */
  private render(deltaTime: number): void {
    const renderStart = performance.now()

    // 执行 kernel
    if (this.kernel && this.currentEffect) {
      const time = this.frameCount * deltaTime
      this.kernel(time)
      this.currentEffect.render(time)
    }

    // 渲染到画布
    if (this.tiCanvas && this.pixels) {
      this.renderer.render(this.pixels, this.canvas!)

      // 应用后处理效果
      if (this.postProcessing.length > 0) {
        this.renderer.applyPostProcessing(this.pixels, this.postProcessing)
      }
    }

    const renderEnd = performance.now()
    const renderTime = renderEnd - renderStart

    this.frameCount++

    // 性能监控
    this.performanceMonitor.recordRenderTime(renderTime)

    // 定期更新 FPS
    if (this.frameCount % 30 === 0) {
      const metrics = this.performanceMonitor.getMetrics()
      this.eventBus.emit('fpsUpdate', metrics.fps)
      this.debugLog(`FPS: ${metrics.fps}, Frame time: ${renderTime.toFixed(2)}ms`)

      // 自动质量调整
      if (this.autoQualityAdjustment && metrics.fps < this.minFpsThreshold) {
        this.adjustQuality()
      }
    }
  }

  /**
   * 自动调整渲染质量（双向调整）
   */
  private adjustQuality(): void {
    const metrics = this.performanceMonitor.getMetrics()
    const qualityLevels = [RenderQuality.ULTRA, RenderQuality.HIGH, RenderQuality.MEDIUM, RenderQuality.LOW]
    const currentIndex = qualityLevels.indexOf(this.quality)

    if (metrics.fps < this.minFpsThreshold) {
      // FPS 太低，降低质量
      if (currentIndex < qualityLevels.length - 1) {
        this.quality = qualityLevels[currentIndex + 1]
        this.renderer.setQuality(this.quality)
        this.eventBus.emit('qualityAdjusted', { quality: this.quality })
        this.debugLog(`Quality lowered to: ${this.quality} (FPS: ${metrics.fps})`)
      }
    } else if (metrics.fps > this.targetFps + 10) {
      // FPS 足够高，尝试提高质量
      if (currentIndex > 0) {
        this.quality = qualityLevels[currentIndex - 1]
        this.renderer.setQuality(this.quality)
        this.eventBus.emit('qualityAdjusted', { quality: this.quality })
        this.debugLog(`Quality increased to: ${this.quality} (FPS: ${metrics.fps})`)
      }
    }
  }

  /**
   * 清理过期缓存
   */
  clearExpiredCache(): void {
    if (this.enableKernelCache) {
      this.kernelCache.clearExpired()
    }
    if (this.enableMemoryPool) {
      this.memoryPool.cleanup()
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { kernelCache: number; memoryPool: any } {
    return {
      kernelCache: this.enableKernelCache ? this.kernelCache.size() : 0,
      memoryPool: this.enableMemoryPool ? this.memoryPool.getStats() : { totalEntries: 0, inUse: 0, bySize: {} },
    }
  }

  // ============================================================================
  // 尺寸管理
  // ============================================================================

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

    // 重新创建像素字段（使用内存池）
    if (this.enableMemoryPool) {
      if (this.pixels) {
        this.memoryPool.release(this.pixels, this.width, this.height)
      }
      this.pixels = this.memoryPool.acquire(width, height)
    } else {
      this.pixels = ti.Vector.field(4, ti.f32, [width, height])
    }

    // 重新创建 kernel（清除缓存）
    if (this.currentEffect) {
      if (this.enableKernelCache) {
        this.kernelCache.clear()
      }
      this.kernel = this.currentEffect.createKernel(ti, this.pixels, this.effectParams)
    }

    this.eventBus.emit('resized', { width, height })
    this.debugLog(`Resized to: ${width}x${height}`)
  }

  // ============================================================================
  // 状态和配置
  // ============================================================================

  /**
   * 获取当前状态
   */
  getState(): EffectState {
    const metrics = this.performanceMonitor.getMetrics()
    return {
      isRunning: this.isRunning,
      currentEffect: this.effectType,
      frameCount: this.frameCount,
      fps: metrics.fps,
      avgFps: metrics.avgFps,
      runTime: (Date.now() - this.startTime) / 1000,
      gpuMemory: metrics.gpuMemory,
      quality: this.quality,
    }
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics()
  }

  /**
   * 设置渲染质量
   */
  setQuality(quality: RenderQuality): void {
    this.quality = quality
    this.renderer.setQuality(quality)
    this.eventBus.emit('qualityChanged', { quality })
    this.debugLog(`Quality set to: ${quality}`)
  }

  /**
   * 设置后处理效果
   */
  setPostProcessing(effects: PostProcessing[]): void {
    this.postProcessing = effects
    this.eventBus.emit('postProcessingChanged', { effects })
    this.debugLog('Post processing updated:', effects)
  }

  /**
   * 切换调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
    this.eventBus.emit('debugModeChanged', { enabled })
    this.debugLog(`Debug mode: ${enabled}`)
  }

  // ============================================================================
  // 事件管理
  // ============================================================================

  /**
   * 订阅事件
   */
  on(event: string, callback: Function): void {
    this.eventBus.on(event, callback)
  }

  /**
   * 取消订阅
   */
  off(event: string, callback: Function): void {
    this.eventBus.off(event, callback)
  }

  // ============================================================================
  // 工具方法
  // ============================================================================

  /**
   * 调试日志
   */
  private debugLog(...args: any[]): void {
    if (this.debugMode) {
      console.log('[TaichiEngine]', ...args)
    }
  }

  // ============================================================================
  // 销毁
  // ============================================================================

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.stop()

    // 释放 GPU 内存
    if (this.pixels && this.enableMemoryPool) {
      this.memoryPool.release(this.pixels, this.width, this.height)
    }

    if (this.currentEffect) {
      this.currentEffect.destroy()
      this.currentEffect = null
    }

    // 清理缓存
    if (this.enableKernelCache) {
      this.kernelCache.clear()
    }
    if (this.enableMemoryPool) {
      this.memoryPool.clear()
    }

    this.eventBus.emit('destroyed', { engine: this })
    this.isInitialized = false
    this.kernel = null
    this.pixels = null
    this.tiCanvas = null
    this.canvas = null

    this.debugLog('Engine destroyed')
  }
}

// ============================================================================
// 导出
// ============================================================================

export type { TaichiEngineConfig }
