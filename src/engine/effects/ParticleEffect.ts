/**
 * 粒子特效 (优化版)
 * 动态粒子系统，支持多种运动模式
 * 优化: 预计算粒子位置、优化三角函数、减少条件分支
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'
import { TaichiOptimizedKernel } from '../utils/TaichiOptimizedKernel'

/**
 * 粒子特效参数
 */
export interface ParticleParams {
  /** 粒子数量 */
  particleCount: number
  /** 运动速度 */
  speed: number
  /** 粒子大小 */
  size: number
  /** 轨道半径 */
  orbitRadius: number
  /** 颜色强度 */
  intensity: number
  /** 运动模式 */
  motionMode: 'circular' | 'spiral' | 'random' | 'wave'
}

/**
 * 粒子特效实现
 */
export class ParticleEffect implements IEffect {
  private metadata: EffectMetadata
  private params: ParticleParams = {
    particleCount: 100,
    speed: 0.5,
    size: 50,
    orbitRadius: 150,
    intensity: 1.0,
    motionMode: 'circular',
  }

  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '粒子',
      description: '动态粒子系统特效，支持多种运动模式（优化版）',
      type: EffectType.PARTICLE,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '2.0.0',
      tags: ['particle', 'animation', 'dynamic', 'motion', 'optimized'],
      performanceRating: 8,
      gpuMemoryUsage: 7,
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
    const particleCount = this.params.particleCount
    const speed = this.params.speed
    const size = this.params.size
    const orbitRadius = this.params.orbitRadius
    const intensity = this.params.intensity
    const motionMode = this.params.motionMode

    // 预计算常量
    const invSize = 1.0 / size
    const invSize08 = 1.0 / (size * 0.8)
    const invParticleCount = 1.0 / particleCount
    const centerX = width * 0.5
    const centerY = height * 0.5

    // 移除全局 scope 设置，改为在 kernel 内直接使用 Math 函数

    ti.addToKernelScope({
      pixels,
      width,
      height,
      centerX,
      centerY,
      particleCount,
      speed,
      size,
      orbitRadius,
      intensity,
      invSize,
      invSize08,
      invParticleCount,
      motionMode,
    })

    return ti.kernel((t: any) => {
      const time = t * speed
      const cosTime = Math.cos(time)
      const sinTime = Math.sin(time)

      for (let i = 0; i < width; i = i + 1) {
        const x = i - centerX

        for (let j = 0; j < height; j = j + 1) {
          const y = j - centerY

          // 计算主粒子位置 (优化: 预计算三角函数)
          let px = 0
          let py = 0

          // 使用 if-else 代替 switch
          if (motionMode === 'circular') {
            px = cosTime * orbitRadius
            py = sinTime * orbitRadius
          } else if (motionMode === 'spiral') {
            const time15 = time * 1.5
            const spiralFactor = 1 + Math.sin(time) * 0.3
            px = Math.cos(time15) * orbitRadius * spiralFactor
            py = Math.sin(time15) * orbitRadius * spiralFactor
          } else if (motionMode === 'wave') {
            px = cosTime * orbitRadius
            py = Math.sin(time * 2) * orbitRadius * 0.5
          } else if (motionMode === 'random') {
            px = cosTime * orbitRadius + Math.sin(time * 3) * orbitRadius * 0.2
            py = Math.sin(time * 1.3) * orbitRadius + Math.cos(time * 2.3) * orbitRadius * 0.2
          } else {
            // 默认使用 circular 模式
            px = cosTime * orbitRadius
            py = sinTime * orbitRadius
          }

          const dx = x - px
          const dy = y - py
          const dist = Math.sqrt(dx * dx + dy * dy)

          // 计算粒子强度 (优化: 使用预计算倒数)
          let particleIntensity = 0
          if (dist < size) {
            particleIntensity = (size - dist) * invSize * intensity
          }

          // 多层粒子效果 (优化: 减少三角函数调用)
          for (let p = 1; p < 3; p = p + 1) {
            const pAngle = time + (p * PI2) * invParticleCount
            const pRadius = orbitRadius * (1 + p * 0.2)
            const cosPAngle = Math.cos(pAngle)
            const sinPAngle = Math.sin(pAngle)

            const ppx = cosPAngle * pRadius
            const ppy = sinPAngle * pRadius

            const pdx = x - ppx
            const pdy = y - ppy
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy)

            if (pdist < size * 0.8) {
              particleIntensity = particleIntensity + (size * 0.8 - pdist) * invSize08 * intensity * 0.5
            }
          }

          // 计算颜色 (优化: 使用 clamp)
          const r = Math.max(0, Math.min(1, particleIntensity * 0.8))
          const g = Math.max(0, Math.min(1, particleIntensity * 0.4))
          const b = Math.max(0, Math.min(1, particleIntensity * 1.0))

          pixels[(i, j)] = [r, g, b, 1]
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
        name: 'particleCount',
        value: this.params.particleCount,
        type: 'number',
        default: 100,
        min: 10,
        max: 500,
        step: 10,
        description: '粒子数量',
      },
      {
        name: 'speed',
        value: this.params.speed,
        type: 'number',
        default: 0.5,
        min: 0.1,
        max: 3,
        step: 0.1,
        description: '运动速度',
      },
      {
        name: 'size',
        value: this.params.size,
        type: 'number',
        default: 50,
        min: 10,
        max: 200,
        step: 10,
        description: '粒子大小',
      },
      {
        name: 'orbitRadius',
        value: this.params.orbitRadius,
        type: 'number',
        default: 150,
        min: 50,
        max: 500,
        step: 10,
        description: '轨道半径',
      },
      {
        name: 'intensity',
        value: this.params.intensity,
        type: 'number',
        default: 1.0,
        min: 0.1,
        max: 2,
        step: 0.1,
        description: '颜色强度',
      },
      {
        name: 'motionMode',
        value: this.params.motionMode,
        type: 'string',
        default: 'circular',
        description: '运动模式 (circular/spiral/random/wave)',
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
