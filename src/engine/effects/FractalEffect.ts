/**
 * 分形特效 - Julia Set (优化版)
 * 基于复数迭代的经典分形算法
 * 优化: 预计算常量、减少除法、优化迭代公式
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'
import { TaichiOptimizedKernel } from '../utils/TaichiOptimizedKernel'

/**
 * 分形特效参数
 */
export interface FractalParams {
  /** 实部 */
  cReal: number
  /** 虚部 */
  cImag: number
  /** 缩放比例 */
  zoom: number
  /** 最大迭代次数 */
  maxIterations: number
  /** 颜色偏移 */
  colorOffset: number
  /** 动画速度 */
  animSpeed: number
}

/**
 * 分形特效实现
 */
export class FractalEffect implements IEffect {
  private metadata: EffectMetadata
  private params: FractalParams = {
    cReal: -0.8,
    cImag: 0.2,
    zoom: 3,
    maxIterations: 50,
    colorOffset: 0,
    animSpeed: 1,
  }

  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '分形',
      description: 'Julia Set 分形特效，基于复数迭代（优化版）',
      type: EffectType.FRACTAL,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '2.0.0',
      tags: ['fractal', 'julia', 'math', 'chaos', 'optimized'],
      performanceRating: 9,
      gpuMemoryUsage: 10,
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
    // 合并参数
    this.params = { ...this.params, ...params }

    const width = this.width
    const height = this.height
    const cReal = this.params.cReal
    const cImag = this.params.cImag
    const zoom = this.params.zoom
    const maxIterations = this.params.maxIterations
    const animSpeed = this.params.animSpeed
    const colorOffset = this.params.colorOffset

    // 预计算常量，减少 kernel 内计算
    const sizeConstants = TaichiOptimizedKernel.createSizeConstants(width, height)
    const invMaxIterations = 1.0 / maxIterations
    const COLOR_PHASE_1 = 2.0943951023931953 // 2 * PI / 3
    const COLOR_PHASE_2 = 4.1887902047863905 // 4 * PI / 3

    // 移除全局 scope 设置，改为在 kernel 内直接使用 Math 函数

    ti.addToKernelScope({
      pixels,
      width,
      height,
      invWidth: sizeConstants.invWidth,
      invHeight: sizeConstants.invHeight,
      zoom,
      invMaxIterations,
      cReal,
      cImag,
      animSpeed,
      colorOffset,
      COLOR_PHASE_1,
      COLOR_PHASE_2,
      PI2: Math.PI * 2,
    })

    return ti.kernel((t: any) => {
      // 动态调整 c 参数
      const time = t * animSpeed
      const cR = cReal + Math.cos(time) * 0.1
      const cI = cImag + Math.sin(time) * 0.1

      // 优化: 使用乘法代替除法
      for (let i = 0; i < width; i = i + 1) {
        const x = (i * invWidth) - 0.5
        const x_zoomed = x * zoom

        for (let j = 0; j < height; j = j + 1) {
          // 映射到复平面 (优化: 预计算部分)
          const z0_r = x_zoomed
          const z0_i = ((j * invHeight) - 0.5) * zoom

          let z_r = z0_r
          let z_i = z0_i
          let iterations = 0
          let z_r2 = z_r * z_r
          let z_i2 = z_i * z_i

          // Julia Set 迭代 (优化: 缓存 z_r^2 和 z_i^2)
          while (z_r2 + z_i2 < 4 && iterations < maxIterations) {
            const z_r_new = z_r2 - z_i2 + cR
            z_i = 2 * z_r * z_i + cI
            z_r = z_r_new
            z_r2 = z_r * z_r
            z_i2 = z_i * z_i
            iterations = iterations + 1
          }

          // 计算颜色 (优化: 使用预计算的倒数)
          const t_val = iterations * invMaxIterations
          const colorPhase = t_val * PI2 + colorOffset

          const r = Math.sin(colorPhase) * 0.5 + 0.5
          const g = Math.sin(colorPhase + COLOR_PHASE_1) * 0.5 + 0.5
          const b = Math.sin(colorPhase + COLOR_PHASE_2) * 0.5 + 0.5

          pixels[(i, j)] = [r * t_val, g * t_val, b * t_val, 1]
        }
      }
    })
  }

  /**
   * 渲染一帧 (由 kernel 处理)
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
        name: 'cReal',
        value: this.params.cReal,
        type: 'number',
        default: -0.8,
        min: -2,
        max: 2,
        step: 0.01,
        description: '复数实部',
      },
      {
        name: 'cImag',
        value: this.params.cImag,
        type: 'number',
        default: 0.2,
        min: -2,
        max: 2,
        step: 0.01,
        description: '复数虚部',
      },
      {
        name: 'zoom',
        value: this.params.zoom,
        type: 'number',
        default: 3,
        min: 1,
        max: 10,
        step: 0.1,
        description: '缩放比例',
      },
      {
        name: 'maxIterations',
        value: this.params.maxIterations,
        type: 'number',
        default: 50,
        min: 10,
        max: 200,
        step: 10,
        description: '最大迭代次数',
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
        name: 'animSpeed',
        value: this.params.animSpeed,
        type: 'number',
        default: 1,
        min: 0,
        max: 5,
        step: 0.1,
        description: '动画速度',
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
