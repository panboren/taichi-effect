/**
 * Taichi.js 特效引擎 - Vue Composable
 * 提供响应式引擎管理
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { debounce, throttle } from '@/utils/performance'
import { detectWebGLSupport, checkTaichiCompatibility, detectWebGPUDetailed } from '@/utils/gpu'
import {
  TaichiEffectEngine,
  type TaichiEngineConfig,
  type EffectType,
  type EffectState,
  type PerformanceMetrics,
  type RenderQuality,
  type PostProcessing,
} from '@/engine'

export interface UseTaichiEngineOptions {
  /** 画布引用 */
  canvasRef: Ref<HTMLCanvasElement | null>
  /** 引擎配置 */
  config?: TaichiEngineConfig
  /** 默认特效 */
  defaultEffect?: EffectType
  /** 初始化后自动启动 */
  autoStart?: boolean
  /** 监听窗口大小变化 */
  autoResize?: boolean
}

export interface UseTaichiEngineReturn {
  // 引擎实例
  engine: Ref<TaichiEffectEngine | null>

  // 状态
  isInitialized: Ref<boolean>
  isRunning: Ref<boolean>
  currentEffect: Ref<EffectType | null>

  // 性能
  fps: Ref<number>
  avgFps: Ref<number>
  frameCount: Ref<number>
  runTime: Ref<number>

  // 方法
  init: () => Promise<void>
  start: () => void
  stop: () => void
  reset: () => void
  destroy: () => void

  // 特效控制
  switchEffect: (effectType: EffectType) => Promise<void>
  updateParams: (params: Record<string, any>) => void
  getParamDefs: () => any[]

  // 质量控制
  setQuality: (quality: RenderQuality) => void
  setPostProcessing: (effects: PostProcessing[]) => void

  // 状态查询
  getState: () => EffectState
  getPerformanceMetrics: () => PerformanceMetrics
  getAvailableEffects: () => EffectType[]

  // 事件监听
  on: (event: string, callback: Function) => void
  off: (event: string, callback: Function) => void

  // 工具方法
  resize: (width: number, height: number) => void
  setDebugMode: (enabled: boolean) => void
}

/**
 * 使用 Taichi.js 特效引擎
 */
export function useTaichiEngine(options: UseTaichiEngineOptions): UseTaichiEngineReturn {
  const {
    canvasRef,
    config = {},
    defaultEffect,
    autoStart = true,
    autoResize = true,
  } = options

  // 引擎实例
  const engine = ref<TaichiEffectEngine | null>(null)

  // 状态
  const isInitialized = ref(false)
  const isRunning = ref(false)
  const currentEffect = ref<EffectType | null>(null)

  // 性能
  const fps = ref(0)
  const avgFps = ref(0)
  const frameCount = ref(0)
  const runTime = ref(0)

  // 性能监控定时器
  let performanceTimer: number | null = null

  // ============================================================================
  // 初始化
  // ============================================================================

  const init = async () => {
    try {
      console.log('[useTaichiEngine] ==========================================')
      console.log('[useTaichiEngine] init() called')
      console.log('[useTaichiEngine] ==========================================')

      // 检查 WebGPU 详细支持情况
      console.log('[useTaichiEngine] Step 1: Checking WebGPU support...')
      const webgpuInfo = await detectWebGPUDetailed()
      console.log('[useTaichiEngine] WebGPU Info:', webgpuInfo)

      // 检查 Taichi.js 兼容性（包含 WebGPU 检测）
      console.log('[useTaichiEngine] Step 2: Checking Taichi.js compatibility...')
      const compatibility = await checkTaichiCompatibility()
      console.log('[useTaichiEngine] Compatibility check result:', {
        compatible: compatibility.compatible,
        webgpuSupported: compatibility.webgpuSupported,
        errors: compatibility.errors,
        warnings: compatibility.warnings
      })

      if (!compatibility.compatible) {
        console.error('[useTaichiEngine] Compatibility check failed:', compatibility.errors)

        // 显示详细的错误信息和修复建议
        if (!compatibility.webgpuSupported) {
          const message = `您的浏览器不支持 WebGPU\n\n${webgpuInfo.error || '未知错误'}\n\n建议修复方法：\n${webgpuInfo.suggestions.join('\n') || '请更新浏览器或显卡驱动'}`

          ElMessageBox.alert(message, 'WebGPU 不可用', {
            confirmButtonText: '知道了',
            type: 'error',
            dangerouslyUseHTMLString: false,
          })
          console.error(message)
        } else {
          // WebGPU API 存在但无法使用
          const message = `WebGPU API 可用，但无法初始化\n\n${webgpuInfo.error || '未知错误'}\n\n建议修复方法：\n${webgpuInfo.suggestions.join('\n') || '请更新浏览器或显卡驱动'}`

          ElMessageBox.alert(message, 'WebGPU 初始化失败', {
            confirmButtonText: '知道了',
            type: 'error',
            dangerouslyUseHTMLString: false,
          })
          console.error(message)
        }
        return
      }

      if (compatibility.warnings.length > 0) {
        console.warn('Compatibility warnings:', compatibility.warnings)
        compatibility.warnings.forEach((warning) => {
          console.warn(`⚠️ ${warning}`)
        })
      }

      // 显示 WebGL 信息（用于调试）
      console.log('[useTaichiEngine] Step 3: Getting WebGL info...')
      const webglInfo = detectWebGLSupport()
      console.log('[useTaichiEngine] WebGL Info:', webglInfo)
      console.log('[useTaichiEngine] WebGPU Adapter:', webgpuInfo.adapter)

      // 等待画布元素准备就绪
      console.log('[useTaichiEngine] Step 4: Checking canvas element...')
      if (!canvasRef.value) {
        console.error('[useTaichiEngine] ERROR: Canvas element not found!')
        ElMessage.error('画布元素未找到')
        return
      }

      console.log('[useTaichiEngine] Canvas element found:', {
        id: canvasRef.value.id,
        width: canvasRef.value.width,
        height: canvasRef.value.height
      })

      // 创建引擎实例
      console.log('[useTaichiEngine] Step 5: Creating TaichiEffectEngine instance...')
      engine.value = new TaichiEffectEngine(config)
      console.log('[useTaichiEngine] Engine instance created ✓')

      // 初始化引擎
      console.log('[useTaichiEngine] Step 6: Initializing engine...')
      console.log('[useTaichiEngine] Calling engine.init(canvasElement)...')
      const success = await engine.value.init(canvasRef.value)
      console.log('[useTaichiEngine] Engine init() returned:', success)

      if (!success) {
        console.error('[useTaichiEngine] ERROR: Engine initialization failed!')
        ElMessage.error('引擎初始化失败')
        return
      }

      console.log('[useTaichiEngine] ==========================================')
      console.log('[useTaichiEngine] ✅ ENGINE INIT SUCCESS ✅')
      console.log('[useTaichiEngine] ==========================================')


      // 订阅事件
      setupEventListeners()

      // 切换到默认特效
      if (defaultEffect) {
        await engine.value.switchEffect(defaultEffect)
        currentEffect.value = defaultEffect
      }

      isInitialized.value = true

      // 自动启动
      if (autoStart) {
        engine.value.start()
        isRunning.value = true
      }

      // 启动性能监控
      startPerformanceMonitoring()

      ElMessage.success('Taichi.js 特效引擎已启动')
    } catch (error) {
      console.error('引擎初始化失败:', error)
      ElMessage.error('引擎初始化失败: ' + (error as Error).message)
    }
  }

  /**
   * 设置事件监听器
   */
  const setupEventListeners = () => {
    if (!engine.value) return

    engine.value.on('started', () => {
      isRunning.value = true
    })

    engine.value.on('stopped', () => {
      isRunning.value = false
    })

    engine.value.on('effectChanged', (data: any) => {
      currentEffect.value = data.effectType
    })

    engine.value.on('fpsUpdate', (value: number) => {
      fps.value = value
    })
  }

  /**
   * 启动性能监控
   */
  const startPerformanceMonitoring = () => {
    performanceTimer = window.setInterval(() => {
      if (engine.value && isRunning.value) {
        const metrics = engine.value.getPerformanceMetrics()
        fps.value = metrics.fps
        avgFps.value = metrics.avgFps
        frameCount.value = engine.value.getState().frameCount
        runTime.value = engine.value.getState().runTime
      }
    }, 1000)
  }

  /**
   * 停止性能监控
   */
  const stopPerformanceMonitoring = () => {
    if (performanceTimer) {
      clearInterval(performanceTimer)
      performanceTimer = null
    }
  }

  // ============================================================================
  // 引擎控制
  // ============================================================================

  const start = () => {
    if (engine.value) {
      engine.value.start()
      isRunning.value = true
    }
  }

  const stop = () => {
    if (engine.value) {
      engine.value.stop()
      isRunning.value = false
    }
  }

  const reset = () => {
    if (engine.value) {
      engine.value.reset()
      frameCount.value = 0
    }
  }

  const destroy = () => {
    stopPerformanceMonitoring()
    if (engine.value) {
      engine.value.destroy()
      engine.value = null
    }
    isInitialized.value = false
    isRunning.value = false
    currentEffect.value = null
  }

  // ============================================================================
  // 特效控制
  // ============================================================================

  const switchEffect = async (effectType: EffectType) => {
    if (engine.value) {
      await engine.value.switchEffect(effectType)
      currentEffect.value = effectType
    }
  }

  // 优化：参数更新使用防抖，避免频繁更新
  const debouncedUpdateParams = debounce((params: Record<string, any>) => {
    if (engine.value) {
      engine.value.updateParams(params)
    }
  }, 100)

  const updateParams = (params: Record<string, any>) => {
    debouncedUpdateParams(params)
  }

  const getParamDefs = () => {
    if (engine.value) {
      return engine.value.getParamDefs()
    }
    return []
  }

  // ============================================================================
  // 质量控制
  // ============================================================================

  const setQuality = (quality: RenderQuality) => {
    if (engine.value) {
      engine.value.setQuality(quality)
    }
  }

  const setPostProcessing = (effects: PostProcessing[]) => {
    if (engine.value) {
      engine.value.setPostProcessing(effects)
    }
  }

  // ============================================================================
  // 状态查询
  // ============================================================================

  const getState = (): EffectState => {
    if (engine.value) {
      return engine.value.getState()
    }
    return {
      isRunning: false,
      currentEffect: EffectType.FRACTAL,
      frameCount: 0,
      fps: 0,
      avgFps: 0,
      runTime: 0,
      gpuMemory: 0,
      quality: RenderQuality.HIGH,
    }
  }

  const getPerformanceMetrics = (): PerformanceMetrics => {
    if (engine.value) {
      return engine.value.getPerformanceMetrics()
    }
    return {
      fps: 0,
      avgFps: 0,
      minFps: 0,
      maxFps: 0,
      frameTime: 0,
      avgFrameTime: 0,
      gpuMemory: 0,
      renderTime: 0,
      totalRenderTime: 0,
    }
  }

  const getAvailableEffects = (): EffectType[] => {
    if (engine.value) {
      return engine.value.getAvailableEffects()
    }
    return []
  }

  // ============================================================================
  // 事件监听
  // ============================================================================

  const on = (event: string, callback: Function) => {
    if (engine.value) {
      engine.value.on(event, callback)
    }
  }

  const off = (event: string, callback: Function) => {
    if (engine.value) {
      engine.value.off(event, callback)
    }
  }

  // ============================================================================
  // 工具方法
  // ============================================================================

  // 优化：resize 使用节流
  const throttledResize = throttle((width: number, height: number) => {
    if (engine.value) {
      engine.value.resize(width, height)
    }
  }, 200)

  const resize = (width: number, height: number) => {
    throttledResize(width, height)
  }

  const setDebugMode = (enabled: boolean) => {
    if (engine.value) {
      engine.value.setDebugMode(enabled)
    }
  }

  // ============================================================================
  // 窗口大小调整
  // ============================================================================

  const handleResize = () => {
    if (autoResize && engine.value) {
      engine.value.resize(window.innerWidth, window.innerHeight)
    }
  }

  // ============================================================================
  // 生命周期
  // ============================================================================

  onMounted(() => {
    if (autoResize) {
      window.addEventListener('resize', handleResize)
    }
  })

  onUnmounted(() => {
    destroy()
    if (autoResize) {
      window.removeEventListener('resize', handleResize)
    }
  })

  // ============================================================================
  // 返回
  // ============================================================================

  return {
    engine,
    isInitialized,
    isRunning,
    currentEffect,
    fps,
    avgFps,
    frameCount,
    runTime,
    init,
    start,
    stop,
    reset,
    destroy,
    switchEffect,
    updateParams,
    getParamDefs,
    setQuality,
    setPostProcessing,
    getState,
    getPerformanceMetrics,
    getAvailableEffects,
    on,
    off,
    resize,
    setDebugMode,
  }
}

// ============================================================================
// 导出
// ============================================================================

export type { UseTaichiEngineOptions, UseTaichiEngineReturn }
