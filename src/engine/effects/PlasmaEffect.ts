/**
 * 等离子特效
 * 基于多层正弦波叠加的等离子效果
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'

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
      description: '多层正弦波叠加的等离子效果',
      type: EffectType.PLASMA,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '1.0.0',
      tags: ['plasma', 'sine', 'layered', 'colorful'],
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
    const amplitude = this.params.amplitude
    const speed = this.params.speed
    const layers = this.params.layers
    const colorSpeed = this.params.colorSpeed
    const blendMode = this.params.blendMode

    ti.addToKernelScope({
      pixels,
      width,
      height,
      frequency,
      amplitude,
      speed,
      layers,
      colorSpeed,
      blendMode,
    })

    return ti.kernel((t: any) => {
      const time = t * speed
      const colorTime = t * colorSpeed

      // 使用嵌套 for 循环代替 for-of
      for (let i = 0; i < width; i = i + 1) {
        for (let j = 0; j < height; j = j + 1) {
          // 归一化坐标
          const x = i / width
          const y = j / height

          let value = 0

          // 多层正弦波叠加
          for (let l = 0; l < layers; l = l + 1) {
            const layerFreq = frequency * (l + 1)
            const layerAmp = amplitude / (l + 1)
            const layerTime = time * (l + 1) * 0.5

            // 不同方向的正弦波
            const wave1 = Math.sin(x * layerFreq * 6.28 + layerTime)
            const wave2 = Math.sin(y * layerFreq * 6.28 + layerTime * 1.3)
            const wave3 = Math.sin((x + y) * layerFreq * 6.28 + layerTime * 0.7)

            // 混合模式 - 使用 if-else 代替 switch
            let layerValue: number
            if (blendMode === 'add') {
              layerValue = (wave1 + wave2 + wave3) * layerAmp / 3
            } else if (blendMode === 'multiply') {
              layerValue = wave1 * wave2 * wave3 * layerAmp
            } else if (blendMode === 'screen') {
              layerValue = 1 - (1 - wave1) * (1 - wave2) * (1 - wave3) * layerAmp
            } else {
              // 默认 add
              layerValue = (wave1 + wave2 + wave3) * layerAmp / 3
            }

            value += layerValue
          }

          // 归一化到 0-1
          value = (value + layers) / (2 * layers)

          // 计算颜色
          const r = Math.sin(value * 6.28 + colorTime) * 0.5 + 0.5
          const g = Math.sin(value * 6.28 + colorTime + 2.1) * 0.5 + 0.5
          const b = Math.sin(value * 6.28 + colorTime + 4.2) * 0.5 + 0.5

          // 增加亮度
          const brightness = value * 1.2

          pixels[(i, j)] = [
            Math.min(r * brightness, 1),
            Math.min(g * brightness, 1),
            Math.min(b * brightness, 1),
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
