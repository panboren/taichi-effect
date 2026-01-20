/**
 * 火焰特效 (优化版)
 * 基于噪声和湍流的火焰模拟
 * 优化: 减少噪声采样、优化火焰公式、预计算常量
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'
import { TaichiOptimizedKernel } from '../utils/TaichiOptimizedKernel'

/**
 * 火焰特效参数
 */
export interface FireParams {
  /** 基础高度 */
  height: number
  /** 湍流强度 */
  turbulence: number
  /** 上升速度 */
  speed: number
  /** 颜色偏移 */
  colorOffset: number
  /** 细节层级 */
  detail: number
  /** 粒子数量 */
  particleCount: number
}

/**
 * 火焰特效实现
 */
export class FireEffect implements IEffect {
  private metadata: EffectMetadata
  private params: FireParams = {
    height: 0.7,
    turbulence: 1.0,
    speed: 1.5,
    colorOffset: 0,
    detail: 3,
    particleCount: 200,
  }

  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '火焰',
      description: '基于噪声的火焰模拟（优化版）',
      type: EffectType.FIRE,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '2.0.0',
      tags: ['fire', 'flame', 'noise', 'turbulence', 'optimized'],
      performanceRating: 8,
      gpuMemoryUsage: 7,
    }
  }

  /**
   * 初始化特效
   */
  async initialize(ti: any, width: number, height: number): Promise<void> {
    this.width = width
    this.height = height
  }

  /**
   * 创建渲染 kernel (优化版)
   */
  createKernel(ti: any, pixels: any, params: Record<string, any>): any {
    this.params = { ...this.params, ...params }

    const width = this.width
    const height = this.height
    const flameHeight = this.params.height
    const turbulence = this.params.turbulence
    const speed = this.params.speed
    const colorOffset = this.params.colorOffset
    const detail = Math.min(this.params.detail, 4) // 限制最大层数
    const particleCount = this.params.particleCount

    // 预计算常量
    const invWidth = 1.0 / width
    const invHeight = 1.0 / height
    const invFlameHeight = 1.0 / flameHeight

    // 移除全局 scope 设置，改为在 kernel 内直接使用 Math 函数

    ti.addToKernelScope({
      pixels,
      width,
      height,
      invWidth,
      invHeight,
      flameHeight,
      invFlameHeight,
      turbulence,
      speed,
      colorOffset,
      detail,
      particleCount,
    })

    return ti.kernel((t: any) => {
      const time = t * speed

      for (let i = 0; i < width; i = i + 1) {
        const x = i * invWidth

        for (let j = 0; j < height; j = j + 1) {
          // 归一化坐标 (优化: 使用乘法)
          let y = (1 - j * invHeight)

          // 只有在火焰高度范围内才计算
          if (y > flameHeight) {
            pixels[(i, j)] = [0, 0, 0, 0]
            continue
          }

          // 归一化到火焰区域 (优化: 预计算倒数)
          const flameY = y * invFlameHeight

          // 湍流噪声 (优化: 减少重复计算)
          let noise = 0
          let amplitude = 1
          let freq = 1

          for (let d = 0; d < detail; d = d + 1) {
            noise = noise + Math.sin(x * freq * PI2 * 3 + time + flameY * 5) * amplitude
            noise = noise + Math.cos(y * freq * PI2 * 2 + time * 0.7) * amplitude
            amplitude = amplitude * 0.5
            freq = freq * 2
          }

          noise = noise * turbulence / detail

          // 火焰形状：底部宽，顶部尖 (优化: 使用 sqrt)
          const shape = Math.sqrt(flameY)

          // 添加湍流
          const flameIntensity = Math.max(0, Math.min(1, shape + noise * 0.2))

          // 粒子效果 (优化: 减少粒子数量计算)
          let particleIntensity = 0
          for (let p = 0; p < particleCount; p = p + 1) {
            const pSeed = p * 0.61803398875
            const sinPSeed = Math.sin(pSeed * PI2)
            const pX = sinPSeed * 0.5 + 0.5
            const pY = (Math.sin(pSeed * PI2 * 2 + time) * 0.5 + 0.5) * flameHeight
            const pSize = 0.02 + Math.sin(pSeed * 10) * 0.01

            const dx = x - pX
            const dy = flameY - pY
            const dist2 = dx * dx + dy * dy

            if (dist2 < pSize * pSize) {
              particleIntensity = particleIntensity + (1 - Math.sqrt(dist2) / pSize) * 0.3
            }
          }

          // 总强度 (优化: 使用 clamp)
          const totalIntensity = Math.max(0, Math.min(1, flameIntensity + particleIntensity))

          // 颜色映射：从黄色到红色到黑色 (优化: 简化条件判断)
          let r, g, b

          if (totalIntensity > 0.7) {
            r = 1
            g = 1 - (totalIntensity - 0.7) * 0.6666666666666666
            b = (totalIntensity - 0.7) * 1.6666666666666666
          } else if (totalIntensity > 0.4) {
            r = 1
            g = (totalIntensity - 0.4) * 2.6666666666666665
            b = 0
          } else {
            r = totalIntensity * 2.5
            g = 0
            b = 0
          }

          // 颜色偏移 (优化: 使用 clamp)
          r = Math.max(0, Math.min(1, r + Math.sin(colorOffset) * 0.1))
          g = Math.max(0, Math.min(1, g + Math.cos(colorOffset) * 0.1))
          b = Math.max(0, Math.min(1, b + Math.sin(colorOffset + 2) * 0.1))

          // 透明度随高度衰减
          const alpha = totalIntensity * (1 - flameY * 0.5)

          pixels[(i, j)] = [r, g, b, alpha]
        }
      }
    })
  }

  /**
   * 渲染一帧
   */
  render(time: number): void {
    // 渲染逻辑已在 kernel 中实现
  }

  /**
   * 更新参数
   */
  updateParams(params: Record<string, any>): void {
    this.params = { ...this.params, ...params }
  }

  /**
   * 获取参数定义
   */
  getParamDefs(): EffectParam[] {
    return [
      {
        name: 'height',
        value: this.params.height,
        type: 'number',
        default: 0.7,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        description: '基础高度',
      },
      {
        name: 'turbulence',
        value: this.params.turbulence,
        type: 'number',
        default: 1.0,
        min: 0.1,
        max: 2,
        step: 0.1,
        description: '湍流强度',
      },
      {
        name: 'speed',
        value: this.params.speed,
        type: 'number',
        default: 1.5,
        min: 0.1,
        max: 5,
        step: 0.1,
        description: '上升速度',
      },
      {
        name: 'colorOffset',
        value: this.params.colorOffset,
        type: 'number',
        default: 0,
        min: 0,
        max: 6.28,
        step: 0.1,
        description: '颜色偏移',
      },
      {
        name: 'detail',
        value: this.params.detail,
        type: 'number',
        default: 3,
        min: 1,
        max: 6,
        step: 1,
        description: '细节层级',
      },
      {
        name: 'particleCount',
        value: this.params.particleCount,
        type: 'number',
        default: 200,
        min: 50,
        max: 500,
        step: 50,
        description: '粒子数量',
      },
    ]
  }

  /**
   * 获取元数据
   */
  getMetadata(): EffectMetadata {
    return { ...this.metadata }
  }

  /**
   * 销毁特效
   */
  destroy(): void {
    this.kernel = null
  }
}
