/**
 * GPU/WebGL 检测和初始化工具
 */

/**
 * 检测 WebGL 支持
 */
export function detectWebGLSupport(): {
  supported: boolean
  version: number
  vendor: string
  renderer: string
  error?: string
} {
  // 创建测试画布
  const canvas = document.createElement('canvas')

  try {
    // 尝试 WebGL 2
    let gl = canvas.getContext('webgl2')
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        supported: true,
        version: 2,
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
      }
    }

    // 尝试 WebGL 1
    gl = canvas.getContext('webgl')
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        supported: true,
        version: 1,
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
      }
    }

    return {
      supported: false,
      version: 0,
      vendor: 'N/A',
      renderer: 'N/A',
      error: 'WebGL not supported',
    }
  } catch (error) {
    return {
      supported: false,
      version: 0,
      vendor: 'N/A',
      renderer: 'N/A',
      error: (error as Error).message,
    }
  } finally {
    canvas.remove()
  }
}

/**
 * 详细的 WebGPU 支持
 */
export interface DetailedWebGPUInfo {
  /** 是否支持 */
  supported: boolean
  /** navigator.gpu 是否存在 */
  hasGPU: boolean
  /** 适配器信息 */
  adapter?: {
    vendor?: string
    architecture?: string
    device?: string
    description?: string
  }
  /** 错误信息 */
  error?: string
  /** 建议的修复方法 */
  suggestions: string[]
}

/**
 * 详细检测 WebGPU 支持
 */
export async function detectWebGPUDetailed(): Promise<DetailedWebGPUInfo> {
  const suggestions: string[] = []

  // 检查 navigator.gpu 是否存在
  if (!navigator.gpu) {
    return {
      supported: false,
      hasGPU: false,
      error: 'navigator.gpu 不可用',
      suggestions: [
        '请使用 Chrome 113+、Edge 113+ 或 Safari 17.2+',
        '或访问 chrome://flags 搜索 "WebGPU" 并启用',
      ],
    }
  }

  // 尝试获取适配器
  try {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      return {
        supported: false,
        hasGPU: true,
        error: '无法获取 GPU 适配器',
        suggestions: [
          '您的浏览器支持 WebGPU API，但底层驱动或硬件不支持',
          '请更新显卡驱动到最新版本',
          '如果使用 Intel 集成显卡，可能需要更新到最新驱动',
          '尝试访问 chrome://flags -> 搜索 "WebGPU" -> 启用所有选项',
        ],
      }
    }

    // 尝试请求设备（这是最关键的一步）
    try {
      const device = await adapter.requestDevice()

      // 如果能创建设备，说明 WebGPU 真正可用
      device.destroy()

      // 尝试获取适配器信息（注意：这个方法在某些浏览器版本中不存在）
      let adapterInfo = null
      try {
        if ('requestAdapterInfo' in adapter) {
          const info = await (adapter as any).requestAdapterInfo()
          adapterInfo = {
            vendor: info.vendor,
            architecture: info.architecture,
            device: info.device,
            description: info.description,
          }
        }
      } catch (e) {
        // requestAdapterInfo 不存在或失败，不影响 WebGPU 可用性
        console.warn('adapter.requestAdapterInfo not available')
      }

      return {
        supported: true,
        hasGPU: true,
        adapter: adapterInfo || {
          vendor: 'Unknown',
          device: 'WebGPU Device',
          description: 'Adapter info not available',
        },
        suggestions: [],
      }
    } catch (deviceError: any) {
      return {
        supported: false,
        hasGPU: true,
        error: `无法创建 GPU 设备: ${deviceError.message || deviceError}`,
        suggestions: [
          'GPU 驱动不兼容，请更新显卡驱动',
          '尝试禁用硬件加速后重新启用',
          'Chrome: 设置 -> 系统 -> 禁用硬件加速 -> 重启浏览器',
          '确保浏览器是最新版本（Chrome 120+, Edge 120+）',
        ],
      }
    }
  } catch (adapterError: any) {
    return {
      supported: false,
      hasGPU: true,
      error: `获取适配器失败: ${adapterError.message || adapterError}`,
      suggestions: [
        '浏览器 WebGPU 支持不完整',
        '请更新到最新版本的 Chrome 或 Edge',
        '尝试使用其他浏览器（Chrome/Edge）',
      ],
    }
  }
}

/**
 * 检测 WebGPU 支持（简化版，用于快速检查）
 */
export async function detectWebGPUSupport(): Promise<{ supported: boolean; error?: string }> {
  const detailed = await detectWebGPUDetailed()
  return {
    supported: detailed.supported,
    error: detailed.error,
  }
}

/**
 * 检查 Taichi.js 兼容性
 */
export async function checkTaichiCompatibility(): Promise<{
  compatible: boolean
  webgpuSupported: boolean
  errors: string[]
  warnings: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查 WebGPU 支持（taichi.js v0.0.36 需要）- 使用异步检测
  const webgpuInfo = await detectWebGPUDetailed()
  if (!webgpuInfo.supported) {
    errors.push(webgpuInfo.error || 'WebGPU 不支持')
    if (webgpuInfo.suggestions.length > 0) {
      errors.push(webgpuInfo.suggestions.join('\n'))
    }
  }

  // 检测 WebGL（用于 GPU 信息）
  const webglInfo = detectWebGLSupport()
  if (!webglInfo.supported) {
    warnings.push(`WebGL 不可用: ${webglInfo.error}`)
  } else if (webglInfo.version < 2) {
    warnings.push('仅支持 WebGL 1，性能可能受限')
  }

  // 检查 GPU 能力
  if (webglInfo.supported) {
    if (webglInfo.renderer.includes('Software')) {
      errors.push('检测到软件渲染器，性能不足')
    }

    // 检查特定 GPU 问题
    const rendererLower = webglInfo.renderer.toLowerCase()
    if (rendererLower.includes('intel') && rendererLower.includes('hd graphics')) {
      warnings.push('Intel 集成显卡可能性能受限')
    }
  }

  return {
    compatible: errors.length === 0,
    webgpuSupported: webgpuInfo.supported,
    errors,
    warnings,
  }
}

/**
 * 等待画布准备就绪
 * 注意：不获取任何上下文，因为 WebGPU 上下文需要由 taichi.js 获取
 */
export async function waitForCanvasReady(canvas: HTMLCanvasElement, timeout: number = 5000): Promise<boolean> {
  const startTime = Date.now()

  return new Promise((resolve) => {
    const checkReady = () => {
      // 检查画布是否在 DOM 中
      if (!document.body.contains(canvas)) {
        if (Date.now() - startTime > timeout) {
          console.warn('Canvas ready timeout')
          resolve(false)
          return
        }
        requestAnimationFrame(checkReady)
        return
      }

      // 检查画布尺寸
      if (canvas.width === 0 || canvas.height === 0) {
        if (Date.now() - startTime > timeout) {
          console.warn('Canvas size timeout')
          resolve(false)
          return
        }
        requestAnimationFrame(checkReady)
        return
      }

      // 画布已就绪（不获取任何上下文，留给 taichi.js 使用）
      resolve(true)
    }

    checkReady()
  })
}

/**
 * 获取 GPU 信息
 */
export function getGPUInfo(): {
  webgl: ReturnType<typeof detectWebGLSupport>
  memory: number | null
  maxTextureSize: number | null
} {
  const canvas = document.createElement('canvas')
  const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null

  let memory: number | null = null
  let maxTextureSize: number | null = null

  if (gl) {
    // 获取最大纹理尺寸
    maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)

    // 尝试获取 GPU 内存（某些浏览器不支持）
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    // 注意：大多数浏览器不暴露真实的 GPU 内存大小
    memory = null
  }

  canvas.remove()

  return {
    webgl: detectWebGLSupport(),
    memory,
    maxTextureSize,
  }
}
