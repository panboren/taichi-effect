/**
 * 分形特效 - Julia Set
 * 基于复数迭代的经典分形算法
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'

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
      description: 'Julia Set 分形特效，基于复数迭代',
      type: EffectType.FRACTAL,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '1.0.0',
      tags: ['fractal', 'julia', 'math', 'chaos'],
      performanceRating: 8,
      gpuMemoryUsage: 12,
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

    ti.addToKernelScope({
      pixels,
      width,
      height,
      cReal,
      cImag,
      zoom,
      maxIterations,
      animSpeed,
      colorOffset,
    })

    return ti.kernel((t: any) => {
      // 动态调整 c 参数
      const time = t * animSpeed
      const cR = cReal + Math.cos(time) * 0.1
      const cI = cImag + Math.sin(time) * 0.1

      // 使用嵌套 for 循环代替 for-of
      for (let i = 0; i < width; i = i + 1) {
        for (let j = 0; j < height; j = j + 1) {
          // 映射到复平面
          const z0_r = ((i / width) - 0.5) * zoom
          const z0_i = ((j / height) - 0.5) * zoom

          let z_r = z0_r
          let z_i = z0_i
          let iterations = 0

          // Julia Set 迭代
          while (z_r * z_r + z_i * z_i < 4 && iterations < maxIterations) {
            const z_r_new = z_r * z_r - z_i * z_i + cR
            z_i = 2 * z_r * z_i + cI
            z_r = z_r_new
            iterations = iterations + 1
          }

          // 计算颜色 - 使用 PI2 常量
          const t_val = iterations / maxIterations
          const r = Math.sin(t_val * PI2 + colorOffset) * 0.5 + 0.5
          const g = Math.sin(t_val * PI2 + colorOffset + 2.1) * 0.5 + 0.5
          const b = Math.sin(t_val * PI2 + colorOffset + 4.2) * 0.5 + 0.5

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
