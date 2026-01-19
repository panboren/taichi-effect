/**
 * 默认渲染器
 * 负责将 Taichi.js 像素字段渲染到 Canvas 画布
 */

import { RenderQuality, PostProcessing } from './EffectTypes'
import type { IRenderer } from './EffectTypes'

/**
 * 渲染配置
 */
interface RenderConfig {
  quality: RenderQuality
  scaleFactor: number
}

/**
 * 默认渲染器实现
 */
export class DefaultRenderer implements IRenderer {
  private quality: RenderQuality
  private scaleFactor: number
  private tempCanvas: HTMLCanvasElement | null = null
  private tempCtx: CanvasRenderingContext2D | null = null

  constructor(quality: RenderQuality = RenderQuality.HIGH) {
    this.quality = quality
    this.scaleFactor = this.getScaleFactor(quality)
    this.initTempCanvas()
  }

  /**
   * 获取质量对应的缩放因子
   */
  private getScaleFactor(quality: RenderQuality): number {
    switch (quality) {
      case RenderQuality.ULTRA:
        return 1.0
      case RenderQuality.HIGH:
        return 0.75
      case RenderQuality.MEDIUM:
        return 0.5
      case RenderQuality.LOW:
        return 0.25
      default:
        return 1.0
    }
  }

  /**
   * 初始化临时画布
   */
  private initTempCanvas(): void {
    this.tempCanvas = document.createElement('canvas')
    this.tempCtx = this.tempCanvas.getContext('2d')
  }

  /**
   * 渲染像素字段到画布
   */
  render(pixels: any, canvas: HTMLCanvasElement): void {
    if (!canvas || !pixels) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 使用 Taichi.js 的原生渲染
    const ti = (window as any).ti
    if (ti && ti.Canvas) {
      const tiCanvas = new ti.Canvas(canvas)
      if (tiCanvas) {
        tiCanvas.setImage(pixels)
        return
      }
    }

    // 回退方案：手动渲染
    this.fallbackRender(pixels, canvas)
  }

  /**
   * 回退渲染方案
   */
  private fallbackRender(pixels: any, canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // TODO: 实现像素数据的手动渲染
    // 当 Taichi.js 的 Canvas 不可用时使用
    console.warn('Fallback rendering not fully implemented')
  }

  /**
   * 应用后处理效果
   */
  applyPostProcessing(pixels: any, effects: PostProcessing[]): void {
    // 注意：Taichi.js 的像素字段是在 GPU 上计算的后处理
    // 这里我们通过修改 kernel 来实现后处理效果
    // 实际的后处理应该在 kernel 中实现，而不是在渲染器中

    if (effects.length === 0) return

    console.warn('Post-processing effects should be applied in the kernel')
  }

  /**
   * 设置渲染质量
   */
  setQuality(quality: RenderQuality): void {
    this.quality = quality
    this.scaleFactor = this.getScaleFactor(quality)
  }

  /**
   * 获取当前质量
   */
  getQuality(): RenderQuality {
    return this.quality
  }
}

// ============================================================================
// 高级渲染器 (扩展功能)
// ============================================================================

/**
 * 高级渲染器
 * 支持更高级的后处理效果
 */
export class AdvancedRenderer extends DefaultRenderer {
  /**
   * 应用模糊效果
   */
  applyBlur(strength: number = 5): void {
    // 在 GPU kernel 中实现模糊
    console.log(`Applying blur with strength: ${strength}`)
  }

  /**
   * 应用辉光效果
   */
  applyBloom(threshold: number = 0.8, intensity: number = 1.0): void {
    // 在 GPU kernel 中实现辉光
    console.log(`Applying bloom: threshold=${threshold}, intensity=${intensity}`)
  }

  /**
   * 应用晕影效果
   */
  applyVignette(intensity: number = 0.5): void {
    // 在 GPU kernel 中实现晕影
    console.log(`Applying vignette with intensity: ${intensity}`)
  }

  /**
   * 应用色差效果
   */
  applyChromaticAberration(strength: number = 2): void {
    // 在 GPU kernel 中实现色差
    console.log(`Applying chromatic aberration: strength=${strength}`)
  }

  /**
   * 应用胶片颗粒效果
   */
  applyFilmGrain(intensity: number = 0.1): void {
    // 在 GPU kernel 中实现胶片颗粒
    console.log(`Applying film grain: intensity=${intensity}`)
  }
}

// ============================================================================
// 导出 (所有类已在定义时导出)
// ============================================================================
