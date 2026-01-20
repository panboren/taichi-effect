/**
 * 简单测试特效 - 用于调试 Taichi.js 问题
 * 最简单的实现，只显示纯色渐变
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'

export interface SimpleTestParams {
  color: number
}

export class SimpleTestEffect implements IEffect {
  private metadata: EffectMetadata
  private params: SimpleTestParams = { color: 0 }
  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '简单测试',
      description: '用于测试 Taichi.js 的简单特效',
      type: EffectType.FRACTAL,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '1.0.0',
      tags: ['test', 'simple'],
      performanceRating: 10,
      gpuMemoryUsage: 1,
    }
  }

  async initialize(ti: any, width: number, height: number): Promise<void> {
    this.width = width
    this.height = height
  }

  createKernel(ti: any, pixels: any, params: Record<string, any>): any {
    this.params = { ...this.params, ...params }

    const w = this.width
    const h = this.height

    return ti.kernel((t: any) => {
      for (let i = 0; i < w; i = i + 1) {
        for (let j = 0; j < h; j = j + 1) {
          const r = i / w
          const g = j / h
          const b = t % 1
          pixels[(i, j)] = [r, g, b, 1]
        }
      }
    })
  }

  render(time: number): void {}

  updateParams(params: Record<string, any>): void {
    this.params = { ...this.params, ...params }
  }

  getParamDefs(): EffectParam[] {
    return [
      {
        name: 'color',
        value: this.params.color,
        type: 'number',
        default: 0,
        min: 0,
        max: 1,
        step: 0.1,
        description: '颜色偏移',
      },
    ]
  }

  getMetadata(): EffectMetadata {
    return { ...this.metadata }
  }

  destroy(): void {
    this.kernel = null
  }
}
