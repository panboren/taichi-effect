/**
 * 波浪特效
 * 多层正弦波叠加，创造流动的视觉效果
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'

/**
 * 波浪特效参数
 */
export interface WaveParams {
  /** 波浪层数 */
  waveCount: number
  /** 主频率 */
  frequency: number
  /** 动画速度 */
  speed: number
  /** 振幅 */
  amplitude: number
  /** 颜色偏移 */
  colorOffset: number
  /** 波浪方向 */
  direction: 'horizontal' | 'vertical' | 'diagonal' | 'radial'
}

/**
 * 波浪特效实现
 */
export class WaveEffect implements IEffect {
  private metadata: EffectMetadata
  private params: WaveParams = {
    waveCount: 3,
    frequency: 10,
    speed: 2,
    amplitude: 0.5,
    colorOffset: 0,
    direction: 'horizontal',
  }

  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '波浪',
      description: '多层正弦波叠加特效',
      type: EffectType.WAVE,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '1.0.0',
      tags: ['wave', 'sine', 'fluid', 'motion'],
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
    const waveCount = this.params.waveCount
    const frequency = this.params.frequency
    const speed = this.params.speed
    const amplitude = this.params.amplitude
    const colorOffset = this.params.colorOffset
    const direction = this.params.direction

    ti.addToKernelScope({
      pixels,
      width,
      height,
      waveCount,
      frequency,
      speed,
      amplitude,
      colorOffset,
      direction,
    })

    return ti.kernel((t: any) => {
      const time = t * speed

      // 使用嵌套 for 循环代替 for-of
      for (let i = 0; i < width; i = i + 1) {
        for (let j = 0; j < height; j = j + 1) {
          const x = i / width
          const y = j / height

          let value = 0

          // 根据方向计算波浪
          for (let w = 0; w < waveCount; w = w + 1) {
            let wave = 0

            // 使用 if-else 代替 switch
            if (direction === 'horizontal') {
              wave = Math.sin(x * frequency * (w + 1) + time * (w + 1))
            } else if (direction === 'vertical') {
              wave = Math.sin(y * frequency * (w + 1) + time * (w + 1))
            } else if (direction === 'diagonal') {
              wave = Math.sin((x + y) * frequency * (w + 1) + time * (w + 1))
            } else if (direction === 'radial') {
              const dx = x - 0.5
              const dy = y - 0.5
              const dist = Math.sqrt(dx * dx + dy * dy)
              wave = Math.sin(dist * frequency * 2 * (w + 1) - time * (w + 1))
            } else {
              // 默认 horizontal
              wave = Math.sin(x * frequency * (w + 1) + time * (w + 1))
            }

            value += wave * (amplitude / waveCount)
          }

          // 归一化到 [0, 1]
          value = (value + amplitude) / (2 * amplitude)

          // 计算颜色 - 使用 PI2 常量
          const r = Math.sin(value * PI2 + colorOffset) * 0.5 + 0.5
          const g = Math.sin(value * PI2 + colorOffset + 2.1) * 0.5 + 0.5
          const b = Math.sin(value * PI2 + colorOffset + 4.2) * 0.5 + 0.5

          pixels[(i, j)] = [r * value, g * value, b * value, 1]
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
        name: 'waveCount',
        value: this.params.waveCount,
        type: 'number',
        default: 3,
        min: 1,
        max: 10,
        step: 1,
        description: '波浪层数',
      },
      {
        name: 'frequency',
        value: this.params.frequency,
        type: 'number',
        default: 10,
        min: 1,
        max: 50,
        step: 1,
        description: '主频率',
      },
      {
        name: 'speed',
        value: this.params.speed,
        type: 'number',
        default: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        description: '动画速度',
      },
      {
        name: 'amplitude',
        value: this.params.amplitude,
        type: 'number',
        default: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        description: '振幅',
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
        name: 'direction',
        value: this.params.direction,
        type: 'string',
        default: 'horizontal',
        description: '波浪方向',
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
