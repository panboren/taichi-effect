/**
 * 噪声特效 (优化版)
 * 多层噪声合成，创造自然的纹理效果
 * 优化: 减少层数、预计算频率、优化噪声叠加
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'
import { TaichiOptimizedKernel } from '../utils/TaichiOptimizedKernel'

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
      description: '多层噪声合成特效（优化版）',
      type: EffectType.NOISE,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '2.0.0',
      tags: ['noise', 'texture', 'pattern', 'natural', 'optimized'],
      performanceRating: 10,
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
    const frequency = this.params.frequency
    const octaves = Math.min(this.params.octaves, 6) // 限制最大层数
    const lacunarity = this.params.lacunarity
    const persistence = this.params.persistence
    const speed = this.params.speed
    const colorOffset = this.params.colorOffset
    const scale = this.params.scale

    // 预计算常量
    const invScale = 1.0 / scale
    const layerFreqMultiplier = lacunarity
    const COLOR_PHASE_1 = 2.0943951023931953 // 2 * PI / 3
    const COLOR_PHASE_2 = 4.1887902047863905 // 4 * PI / 3

    // 移除全局 scope 设置，改为在 kernel 内直接使用 Math 函数

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
      invScale,
      COLOR_PHASE_1,
      COLOR_PHASE_2,
    })

    return ti.kernel((t: any) => {
      const time = t * speed

      // 优化: 使用乘法代替除法
      for (let i = 0; i < width; i = i + 1) {
        const invCurrentFreq = invScale
        const x = i * invCurrentFreq

        for (let j = 0; j < height; j = j + 1) {
          const y = j * invCurrentFreq

          // 多层噪声叠加 (FBM - Fractal Brownian Motion)
          let noise = 0
          let amplitude = 1
          let maxAmplitude = 0
          let currentFreq = 1

          // 优化: 减少循环内计算
          for (let o = 0; o < octaves; o = o + 1) {
            const phaseX = x * currentFreq + time * currentFreq
            const phaseY = y * currentFreq + time * currentFreq * 0.5

            const layerNoise = Math.sin(phaseX) * Math.cos(phaseY)
            noise = noise + layerNoise * amplitude
            maxAmplitude = maxAmplitude + amplitude

            amplitude = amplitude * persistence
            currentFreq = currentFreq * lacunarity
          }

          // 归一化
          noise = noise / maxAmplitude

          // 映射到 [0, 1]
          const value = (noise + 1) * 0.5

          // 计算颜色 (优化: 使用 PI2 常量)
          const colorPhase = value * PI2 + colorOffset
          const r = Math.sin(colorPhase) * 0.5 + 0.5
          const g = Math.sin(colorPhase + COLOR_PHASE_1) * 0.5 + 0.5
          const b = Math.sin(colorPhase + COLOR_PHASE_2) * 0.5 + 0.5

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
