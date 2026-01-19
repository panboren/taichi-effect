/**
 * 噪声特效
 * 多层噪声合成，创造自然的纹理效果
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'

/**
 * 噪声特效参数
 */
export interface NoiseParams {
  /** 基础频率 */
  frequency: number
  /** 噪声层数 */
  octaves: number
  /** 持续度 (lacunarity) */
  lacunarity: number
  /** 持久度 (persistence) */
  persistence: number
  /** 动画速度 */
  speed: number
  /** 颜色偏移 */
  colorOffset: number
  /** 缩放 */
  scale: number
}

/**
 * 噪声特效实现
 */
export class NoiseEffect implements IEffect {
  private metadata: EffectMetadata
  private params: NoiseParams = {
    frequency: 50,
    octaves: 3,
    lacunarity: 2,
    persistence: 0.5,
    speed: 1,
    colorOffset: 0,
    scale: 50,
  }

  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '噪声',
      description: '多层噪声合成特效',
      type: EffectType.NOISE,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '1.0.0',
      tags: ['noise', 'texture', 'pattern', 'natural'],
      performanceRating: 9,
      gpuMemoryUsage: 6,
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
    const frequency = this.params.frequency
    const octaves = this.params.octaves
    const lacunarity = this.params.lacunarity
    const persistence = this.params.persistence
    const speed = this.params.speed
    const colorOffset = this.params.colorOffset
    const scale = this.params.scale

    ti.addToKernelScope({
      pixels,
      width,
      height,
      frequency,
      octaves,
      lacunarity,
      persistence,
      speed,
      colorOffset,
      scale,
    })

    return ti.kernel((t: any) => {
      const time = t * speed

      // 使用嵌套 for 循环代替 for-of
      for (let i = 0; i < width; i = i + 1) {
        for (let j = 0; j < height; j = j + 1) {
          // 多层噪声叠加 (FBM - Fractal Brownian Motion)
          let noise = 0
          let amplitude = 1
          let maxAmplitude = 0
          let currentFreq = 1

          for (let o = 0; o < octaves; o = o + 1) {
            const x = i / (scale / currentFreq)
            const y = j / (scale / currentFreq)

            const layerNoise = Math.sin(x + time * currentFreq) * Math.cos(y + time * currentFreq * 0.5)
            noise += layerNoise * amplitude

            maxAmplitude += amplitude
            amplitude *= persistence
            currentFreq *= lacunarity
          }

          // 归一化
          noise = noise / maxAmplitude

          // 映射到 [0, 1]
          const value = (noise + 1) / 2

          // 计算颜色
          const r = Math.sin(value * 6.28 + colorOffset) * 0.5 + 0.5
          const g = Math.sin(value * 6.28 + colorOffset + 2.1) * 0.5 + 0.5
          const b = Math.sin(value * 6.28 + colorOffset + 4.2) * 0.5 + 0.5

          pixels[(i, j)] = [r * value, g * value * 0.8, b * value * 0.6, 1]
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
        name: 'frequency',
        value: this.params.frequency,
        type: 'number',
        default: 50,
        min: 10,
        max: 200,
        step: 10,
        description: '基础频率',
      },
      {
        name: 'octaves',
        value: this.params.octaves,
        type: 'number',
        default: 3,
        min: 1,
        max: 8,
        step: 1,
        description: '噪声层数',
      },
      {
        name: 'lacunarity',
        value: this.params.lacunarity,
        type: 'number',
        default: 2,
        min: 1,
        max: 4,
        step: 0.1,
        description: '持续度 (频率增长)',
      },
      {
        name: 'persistence',
        value: this.params.persistence,
        type: 'number',
        default: 0.5,
        min: 0.1,
        max: 0.9,
        step: 0.1,
        description: '持久度 (振幅衰减)',
      },
      {
        name: 'speed',
        value: this.params.speed,
        type: 'number',
        default: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        description: '动画速度',
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
        name: 'scale',
        value: this.params.scale,
        type: 'number',
        default: 50,
        min: 10,
        max: 200,
        step: 10,
        description: '缩放',
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
