/**
 * 图片优化工具
 */

/**
 * 获取最优图片格式
 * 根据浏览器支持情况返回最佳格式
 */
export function getOptimalImageFormat(): 'webp' | 'jpeg' | 'png' {
  // 检查浏览器是否支持 WebP
  if (supportsWebP()) {
    return 'webp'
  }

  // 检查浏览器是否支持 JPEG
  return 'jpeg'
}

/**
 * 检测浏览器是否支持 WebP
 */
function supportsWebP(): boolean {
  if (typeof document === 'undefined') {
    return false
  }

  const elem = document.createElement('canvas')

  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }

  return false
}

/**
 * 懒加载图片
 */
export function lazyLoadImage(src: string, options?: LazyImageOptions): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src

    if (options?.loading) {
      img.src = options.loading
    }

    img.onload = () => {
      if (options?.placeholder) {
        // 如果有占位图，先显示占位图，再加载原图
        setTimeout(() => {
          img.src = src
        }, 0)
      }
      resolve(img)
    }

    img.onerror = () => {
      if (options?.error) {
        img.src = options.error
      }
      reject(new Error(`Failed to load image: ${src}`))
    }
  })
}

/**
 * 图片压缩配置
 */
export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

/**
 * 压缩图片（使用 Canvas）
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'webp'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    reader.onerror = reject

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      // 计算缩放后的尺寸
      let { width, height } = img
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1)

      width *= ratio
      height *= ratio

      canvas.width = width
      canvas.height = height

      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height)

      // 导出压缩后的图片
      const mimeType = format === 'webp' ? 'image/webp' : `image/${format}`
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        mimeType,
        quality
      )
    }

    img.onerror = reject

    reader.readAsDataURL(file)
  })
}

/**
 * 懒加载图片选项
 */
export interface LazyImageOptions {
  loading?: string // 加载中的占位图
  error?: string // 加载失败的占位图
  placeholder?: string // 临时占位图
}

/**
 * 响应式图片生成
 */
export function generateResponsiveImage(
  baseUrl: string,
  widths: number[] = [320, 640, 1024, 1920]
): string[] {
  return widths.map((width) => {
    const url = new URL(baseUrl)
    url.searchParams.set('width', width.toString())
    return url.toString()
  })
}

/**
 * 图片加载状态钩子
 */
export function useImageLoader() {
  const loading = ref(false)
  const error = ref(false)
  const loaded = ref(false)

  const onLoad = () => {
    loading.value = false
    loaded.value = true
    error.value = false
  }

  const onError = () => {
    loading.value = false
    error.value = true
  }

  const onLoadStart = () => {
    loading.value = true
    error.value = false
    loaded.value = false
  }

  return {
    loading,
    error,
    loaded,
    onLoad,
    onError,
    onLoadStart
  }
}
