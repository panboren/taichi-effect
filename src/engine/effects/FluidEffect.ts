/**
 * 流体特效 (优化版)
 * 基于湍流噪声的流体模拟
 * 优化: 预计算噪声层、优化三角函数、减少重复计算
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'
import { TaichiOptimizedKernel } from '../utils/TaichiOptimizedKernel'

/**
 * 流体特效参数
 */
export interface FluidParams {
  /** 噪声频率 */
  frequency: number
  /** 流动速度 */
  speed: number
  /** 湍流强度 */
  turbulence: number
  /** 颜色循环速度 */
  colorSpeed: number
  /** 颜色密度 */
  colorDensity: number
}

/**
 * 流体特效实现
 */
export class FluidEffect implements IEffect {
  private metadata: EffectMetadata
  private params: FluidParams = {
    frequency: 20,
    speed: 3,
    turbulence: 5,
    colorSpeed: 1,
    colorDensity: 1,
  }

  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '流体',
      description: '湍流噪声流体特效（优化版）',
      type: EffectType.FLUID,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '2.0.0',
      tags: ['fluid', 'noise', 'turbulence', 'organic', 'optimized'],
      performanceRating: 7,
      gpuMemoryUsage: 8,
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
    const frequency = this.params.frequency
    const speed = this.params.speed
    const turbulence = this.params.turbulence
    const colorSpeed = this.params.colorSpeed
    const colorDensity = this.params.colorDensity

    // 预计算常量
    const invWidth = 1.0 / width
    const invHeight = 1.0 / height
    const inv3_5 = 1.0 / 3.5
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
      speed,
      turbulence,
      colorSpeed,
      colorDensity,
      inv3_5,
      COLOR_PHASE_1,
      COLOR_PHASE_2,
    })

    return ti.kernel((t: any) => {
      const time = t * speed
      const colorPhase = time * colorSpeed

      for (let i = 0; i < width; i = i + 1) {
        const x = i * invWidth - 0.5

        for (let j = 0; j < height; j = j + 1) {
          const y = j * invHeight - 0.5

          // 转换为极坐标
          const angle = Math.atan2(y, x)
          const radius = Math.sqrt(x * x + y * y)

          // 多层湍流噪声 (优化: 减少重复计算)
          const rFreq = radius * frequency
          const angleTurb = angle * turbulence

          let noise = Math.sin(rFreq - time + angleTurb)
          noise = noise + Math.sin(rFreq * 2 - time * 1.5 + angleTurb * 1.5) * 0.5
          noise = noise + Math.sin(rFreq * 3 - time * 2 + angleTurb * 2) * 0.25

          // 归一化 (优化: 使用预计算倒数)
          noise = (noise + 1.75) * inv3_5

          // 计算颜色 (优化: 使用 PI2 常量和常量相位)
          const noisePhase = noise * PI2 * colorDensity + colorPhase
          const r = Math.sin(noisePhase) * 0.5 + 0.5
          const g = Math.sin(noisePhase + COLOR_PHASE_1) * 0.5 + 0.5
          const b = Math.sin(noisePhase + COLOR_PHASE_2) * 0.5 + 0.5

          // 添加暗角效果 (优化: 使用 clamp)
          const finalIntensity = Math.max(0, Math.min(1, 1 - radius * 2))

          pixels[(i, j)] = [r * finalIntensity, g * finalIntensity, b * finalIntensity, 1]
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
        default: 20,
        min: 5,
        max: 50,
        step: 1,
        description: '噪声频率',
      },
      {
        name: 'speed',
        value: this.params.speed,
        type: 'number',
        default: 3,
        min: 0.5,
        max: 10,
        step: 0.5,
        description: '流动速度',
      },
      {
        name: 'turbulence',
        value: this.params.turbulence,
        type: 'number',
        default: 5,
        min: 1,
        max: 20,
        step: 1,
        description: '湍流强度',
      },
      {
        name: 'colorSpeed',
        value: this.params.colorSpeed,
        type: 'number',
        default: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        description: '颜色循环速度',
      },
      {
        name: 'colorDensity',
        value: this.params.colorDensity,
        type: 'number',
        default: 1,
        min: 0.5,
        max: 5,
        step: 0.1,
        description: '颜色密度',
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
