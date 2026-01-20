/**
 * 波浪特效 (优化版)
 * 多层正弦波叠加，创造流动的视觉效果
 * 优化: 预计算频率倍数、减少三角函数调用
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'
import { TaichiOptimizedKernel } from '../utils/TaichiOptimizedKernel'

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
      description: '多层正弦波叠加特效（优化版）',
      type: EffectType.WAVE,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '2.0.0',
      tags: ['wave', 'sine', 'fluid', 'motion', 'optimized'],
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
    const waveCount = this.params.waveCount
    const frequency = this.params.frequency
    const speed = this.params.speed
    const amplitude = this.params.amplitude
    const colorOffset = this.params.colorOffset
    const direction = this.params.direction

    // 预计算常量
    const invWidth = 1.0 / width
    const invHeight = 1.0 / height
    const inv2Amplitude = 1.0 / (2 * amplitude)
    const amplitudePerWave = amplitude / waveCount
    const COLOR_PHASE_1 = 2.0943951023931953 // 2 * PI / 3
    const COLOR_PHASE_2 = 4.1887902047863905 // 4 * PI / 3

    // 移除全局 scope 设置，改为在 kernel 内直接使用 Math 函数

    ti.addToKernelScope({
      pixels,
      width,
      height,
      invWidth,
      invHeight,
      waveCount,
      frequency,
      speed,
      amplitude,
      inv2Amplitude,
      amplitudePerWave,
      colorOffset,
      direction,
      COLOR_PHASE_1,
      COLOR_PHASE_2,
    })

    return ti.kernel((t: any) => {
      const time = t * speed

      for (let i = 0; i < width; i = i + 1) {
        const x = i * invWidth

        for (let j = 0; j < height; j = j + 1) {
          const y = j * invHeight

          let value = 0

          // 根据方向计算波浪
          for (let w = 0; w < waveCount; w = w + 1) {
            const waveMult = w + 1
            const phase = time * waveMult
            let wave = 0

            // 使用 if-else 代替 switch
            if (direction === 'horizontal') {
              wave = Math.sin(x * frequency * waveMult + phase)
            } else if (direction === 'vertical') {
              wave = Math.sin(y * frequency * waveMult + phase)
            } else if (direction === 'diagonal') {
              wave = Math.sin((x + y) * frequency * waveMult + phase)
            } else if (direction === 'radial') {
              const dx = x - 0.5
              const dy = y - 0.5
              const dist = Math.sqrt(dx * dx + dy * dy)
              wave = Math.sin(dist * frequency * 2 * waveMult - phase)
            } else {
              // 默认 horizontal
              wave = Math.sin(x * frequency * waveMult + phase)
            }

            value = value + wave * amplitudePerWave
          }

          // 归一化到 [0, 1] (优化: 使用预计算倒数)
          value = (value + amplitude) * inv2Amplitude

          // 计算颜色 (优化: 使用常量)
          const colorPhase = value * PI2 + colorOffset
          const r = Math.sin(colorPhase) * 0.5 + 0.5
          const g = Math.sin(colorPhase + COLOR_PHASE_1) * 0.5 + 0.5
          const b = Math.sin(colorPhase + COLOR_PHASE_2) * 0.5 + 0.5

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
