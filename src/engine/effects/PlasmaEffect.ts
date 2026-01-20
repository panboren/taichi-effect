/**
 * 等离子特效 (优化版)
 * 基于多层正弦波叠加的等离子效果
 * 优化: 预计算频率、优化波形叠加、减少重复计算
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'
import { TaichiOptimizedKernel } from '../utils/TaichiOptimizedKernel'

/**
 * 等离子特效参数
 */
export interface PlasmaParams {
  /** 频率 */
  frequency: number
  /** 振幅 */
  amplitude: number
  /** 速度 */
  speed: number
  /** 层数 */
  layers: number
  /** 颜色速度 */
  colorSpeed: number
  /** 混合模式 */
  blendMode: 'add' | 'multiply' | 'screen'
}

/**
 * 等离子特效实现
 */
export class PlasmaEffect implements IEffect {
  private metadata: EffectMetadata
  private params: PlasmaParams = {
    frequency: 5,
    amplitude: 1,
    speed: 1,
    layers: 4,
    colorSpeed: 2,
    blendMode: 'add',
  }

  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '等离子',
      description: '多层正弦波叠加的等离子效果（优化版）',
      type: EffectType.PLASMA,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '2.0.0',
      tags: ['plasma', 'sine', 'layered', 'colorful', 'optimized'],
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
    const amplitude = this.params.amplitude
    const speed = this.params.speed
    const layers = this.params.layers
    const colorSpeed = this.params.colorSpeed
    const blendMode = this.params.blendMode

    // 预计算常量
    const invWidth = 1.0 / width
    const invHeight = 1.0 / height
    const inv2Layers = 1.0 / (2 * layers)
    const COLOR_PHASE_1 = 2.0943951023931953 // 2 * PI / 3
    const COLOR_PHASE_2 = 4.1887902047863905 // 4 * PI / 3

    // 移除全局 scope 设置，改为在 kernel 内直接使用 Math 函数

    ti.addToKernelScope({
      pixels,
      width,
      height,
      invWidth,
      invHeight,
      frequency,
      amplitude,
      speed,
      layers,
      colorSpeed,
      inv2Layers,
      blendMode,
      COLOR_PHASE_1,
      COLOR_PHASE_2,
      PI2: Math.PI * 2,
    })

    return ti.kernel((t: any) => {
      const time = t * speed
      const colorTime = t * colorSpeed

      // 优化: 使用乘法代替除法
      for (let i = 0; i < width; i = i + 1) {
        const x = i * invWidth

        for (let j = 0; j < height; j = j + 1) {
          const y = j * invHeight

          let value = 0

          // 多层正弦波叠加 (优化: 减少重复计算)
          for (let l = 0; l < layers; l = l + 1) {
            const layerMult = l + 1
            const layerFreq = frequency * layerMult
            const layerAmp = amplitude / layerMult
            const layerTime = time * layerMult * 0.5

            // 不同方向的正弦波 (优化: 使用 PI2 常量)
            const wavePhase1 = x * layerFreq * PI2 + layerTime
            const wavePhase2 = y * layerFreq * PI2 + layerTime * 1.3
            const wavePhase3 = (x + y) * layerFreq * PI2 + layerTime * 0.7

            const wave1 = Math.sin(wavePhase1)
            const wave2 = Math.sin(wavePhase2)
            const wave3 = Math.sin(wavePhase3)

            // 混合模式 - 使用 if-else 代替 switch
            let layerValue = 0

            if (blendMode === 'add') {
              layerValue = (wave1 + wave2 + wave3) * layerAmp * 0.3333333333333333
            } else if (blendMode === 'multiply') {
              layerValue = wave1 * wave2 * wave3 * layerAmp
            } else if (blendMode === 'screen') {
              const inv1 = 1 - wave1
              const inv2 = 1 - wave2
              const inv3 = 1 - wave3
              layerValue = 1 - inv1 * inv2 * inv3 * layerAmp
            } else {
              // 默认 add
              layerValue = (wave1 + wave2 + wave3) * layerAmp * 0.3333333333333333
            }

            value = value + layerValue
          }

          // 归一化到 0-1 (优化: 使用预计算倒数)
          value = (value + layers) * inv2Layers

          // 计算颜色 (优化: 使用常量)
          const colorPhase = value * PI2 + colorTime
          const r = Math.sin(colorPhase) * 0.5 + 0.5
          const g = Math.sin(colorPhase + COLOR_PHASE_1) * 0.5 + 0.5
          const b = Math.sin(colorPhase + COLOR_PHASE_2) * 0.5 + 0.5

          // 增加亮度
          const brightness = Math.max(0, Math.min(1, value * 1.2))

          pixels[(i, j)] = [
            Math.max(0, Math.min(1, r * brightness)),
            Math.max(0, Math.min(1, g * brightness)),
            Math.max(0, Math.min(1, b * brightness)),
            1,
          ]
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
        default: 5,
        min: 1,
        max: 20,
        step: 0.5,
        description: '频率',
      },
      {
        name: 'amplitude',
        value: this.params.amplitude,
        type: 'number',
        default: 1,
        min: 0.1,
        max: 2,
        step: 0.1,
        description: '振幅',
      },
      {
        name: 'speed',
        value: this.params.speed,
        type: 'number',
        default: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        description: '速度',
      },
      {
        name: 'layers',
        value: this.params.layers,
        type: 'number',
        default: 4,
        min: 1,
        max: 8,
        step: 1,
        description: '层数',
      },
      {
        name: 'colorSpeed',
        value: this.params.colorSpeed,
        type: 'number',
        default: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        description: '颜色速度',
      },
      {
        name: 'blendMode',
        value: this.params.blendMode,
        type: 'string',
        default: 'add',
        description: '混合模式 (add/multiply/screen)',
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
