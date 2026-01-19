/**
 * 粒尘特效
 * 使用 ti.rand() 生成随机粒子，展示 taichi.js 随机数功能
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'

/**
 * 粒尘特效参数
 */
export interface DustParams {
  /** 粒子数量 */
  particleCount: number
  /** 粒子大小 */
  particleSize: number
  /** 漂浮速度 */
  driftSpeed: number
  /** 密度 */
  density: number
  /** 颜色 */
  color: number[]
}

/**
 * 粒尘特效实现
 */
export class DustEffect implements IEffect {
  private metadata: EffectMetadata
  private params: DustParams = {
    particleCount: 10000,
    particleSize: 2,
    driftSpeed: 0.5,
    density: 0.3,
    color: [1.0, 1.0, 1.0],
  }

  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '粒尘',
      description: '使用随机数生成的漂浮粒尘特效',
      type: EffectType.DUST,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '1.0.0',
      tags: ['dust', 'particles', 'random', 'ambient'],
      performanceRating: 8,
      gpuMemoryUsage: 5,
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
   * 创建渲染 kernel
   */
  createKernel(ti: any, pixels: any, params: Record<string, any>): any {
    this.params = { ...this.params, ...params }

    const width = this.width
    const height = this.height
    const particleCount = this.params.particleCount
    const particleSize = this.params.particleSize
    const driftSpeed = this.params.driftSpeed
    const density = this.params.density
    const colorR = this.params.color[0]
    const colorG = this.params.color[1]
    const colorB = this.params.color[2]

    ti.addToKernelScope({
      pixels,
      width,
      height,
      particleCount,
      particleSize,
      driftSpeed,
      density,
      colorR,
      colorG,
      colorB,
    })

    return ti.kernel((t: any) => {
      const time = t * driftSpeed

      // 使用嵌套 for 循环代替 for-of
      for (let i = 0; i < width; i = i + 1) {
        for (let j = 0; j < height; j = j + 1) {
          // 背景颜色（深色）
          let r = 0.05
          let g = 0.05
          let b = 0.1

          // 使用 for 循环计算多个粒子
          for (let p = 0; p < particleCount; p = p + 1) {
            const idx = p

            // 使用随机数生成粒子位置（伪随机，基于 idx 和 time）
            const seed = idx + time * 10

            // 简单的伪随机函数
            const rand = seed * 1103515245 + 12345
            const randNormalized = (rand % 10000) / 10000

            // 粒子位置
            const px = (randNormalized * width) % width
            const py = ((randNormalized * 10000) % height)

            // 计算距离
            const dx = i - px
            const dy = j - py
            const dist = Math.sqrt(dx * dx + dy * dy)

            // 粒子强度
            if (dist < particleSize) {
              const intensity = ((particleSize - dist) / particleSize) * density
              r += colorR * intensity
              g += colorG * intensity
              b += colorB * intensity
            }
          }

          // 颜色饱和
          r = Math.min(r, 1)
          g = Math.min(g, 1)
          b = Math.min(b, 1)

          pixels[(i, j)] = [r, g, b, 1]
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
        name: 'particleCount',
        value: this.params.particleCount,
        type: 'number',
        default: 10000,
        min: 1000,
        max: 50000,
        step: 1000,
        description: '粒子数量',
      },
      {
        name: 'particleSize',
        value: this.params.particleSize,
        type: 'number',
        default: 2,
        min: 1,
        max: 10,
        step: 0.5,
        description: '粒子大小',
      },
      {
        name: 'driftSpeed',
        value: this.params.driftSpeed,
        type: 'number',
        default: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        description: '漂浮速度',
      },
      {
        name: 'density',
        value: this.params.density,
        type: 'number',
        default: 0.3,
        min: 0.1,
        max: 1,
        step: 0.1,
        description: '粒子密度',
      },
      {
        name: 'color',
        value: this.params.color,
        type: 'color',
        default: [1.0, 1.0, 1.0],
        description: '粒子颜色',
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
