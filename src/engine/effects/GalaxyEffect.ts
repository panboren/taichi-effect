/**
 * 星系特效 (优化版)
 * 螺旋星系模拟
 * 优化: 预计算常量、优化三角函数、减少距离计算
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'
import { TaichiOptimizedKernel } from '../utils/TaichiOptimizedKernel'

/**
 * 星系特效参数
 */
export interface GalaxyParams {
  /** 螺旋臂数量 */
  armCount: number
  /** 螺旋紧密度 */
  tightness: number
  /** 旋转速度 */
  rotationSpeed: number
  /** 中心亮度 */
  centerBrightness: number
  /** 星系大小 */
  size: number
  /** 颜色偏移 */
  colorOffset: number
}

/**
 * 星系特效实现
 */
export class GalaxyEffect implements IEffect {
  private metadata: EffectMetadata
  private params: GalaxyParams = {
    armCount: 2,
    tightness: 0.01,
    rotationSpeed: 0.3,
    centerBrightness: 1.0,
    size: 300,
    colorOffset: 0,
  }

  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '星系',
      description: '螺旋星系特效（优化版）',
      type: EffectType.GALAXY,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '2.0.0',
      tags: ['galaxy', 'spiral', 'space', 'astronomy', 'optimized'],
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
    const armCount = this.params.armCount
    const tightness = this.params.tightness
    const rotationSpeed = this.params.rotationSpeed
    const centerBrightness = this.params.centerBrightness
    const size = this.params.size
    const colorOffset = this.params.colorOffset

    // 预计算常量
    const invSize = 1.0 / size
    const invSize03 = 1.0 / (size * 0.3)
    const armAngleMultiplier = 2 * Math.PI / armCount
    const COLOR_PHASE_1 = 2.0943951023931953 // 2 * PI / 3
    const COLOR_PHASE_2 = 4.1887902047863905 // 4 * PI / 3

    // 移除全局 scope 设置，改为在 kernel 内直接使用 Math 函数

    ti.addToKernelScope({
      pixels,
      width,
      height,
      centerX: width * 0.5,
      centerY: height * 0.5,
      armCount,
      tightness,
      rotationSpeed,
      centerBrightness,
      invSize,
      invSize03,
      colorOffset,
      armAngleMultiplier,
      COLOR_PHASE_1,
      COLOR_PHASE_2,
    })

    return ti.kernel((t: any) => {
      const time = t * rotationSpeed

      for (let i = 0; i < width; i = i + 1) {
        const x = i - centerX
        const x2 = x * x

        for (let j = 0; j < height; j = j + 1) {
          const y = j - centerY
          const y2 = y * y

          // 优化: 使用平方距离，延迟开方
          const dist2 = x2 + y2
          const distFromCenter = Math.sqrt(dist2)

          // 转换为极坐标
          const angle = Math.atan2(y, x)

          // 螺旋公式
          const spiral = angle + time + distFromCenter * tightness

          // 计算螺旋臂 (优化: 减少循环内计算)
          let armIntensity = 0
          for (let arm = 0; arm < armCount; arm = arm + 1) {
            const armAngle = arm * armAngleMultiplier
            let armDist = spiral - armAngle

            // 标准化到 [-PI, PI]
            if (armDist < -Math.PI) armDist = armDist + Math.PI * 2
            if (armDist > Math.PI) armDist = armDist - Math.PI * 2

            armIntensity += Math.exp(-Math.abs(armDist) * 3)
          }

          // 基于距离的亮度衰减 (优化: 使用预计算倒数)
          const distBrightness = Math.max(0, Math.min(1, 1 - distFromCenter * invSize))
          const centerGlow = Math.exp(-distFromCenter * invSize03) * centerBrightness

          // 总亮度
          let brightness = armIntensity * distBrightness * 0.8 + centerGlow * 0.2

          // 添加随机星点 (优化: 减少计算)
          const starPhase = Math.sin(distFromCenter * 50 + spiral * 10) * 0.5 + 0.5
          if (starPhase > 0.98) {
            brightness = brightness + (starPhase - 0.98) * 10
          }

          // 计算颜色 (优化: 使用常量)
          const colorPhase = spiral + colorOffset
          const r = Math.sin(colorPhase) * 0.5 + 0.5
          const g = Math.sin(colorPhase + COLOR_PHASE_1) * 0.5 + 0.5
          const b = Math.sin(colorPhase + COLOR_PHASE_2) * 0.5 + 0.5

          // 中心偏暖色，外围偏冷色
          const centerColor = 1 - distBrightness
          const finalR = r * (1 - centerColor * 0.5)
          const finalG = g * (1 - centerColor * 0.3)
          const finalB = Math.max(0, Math.min(1, b + centerColor * 0.3))

          pixels[(i, j)] = [
            Math.max(0, Math.min(1, finalR * brightness)),
            Math.max(0, Math.min(1, finalG * brightness)),
            Math.max(0, Math.min(1, finalB * brightness)),
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
        name: 'armCount',
        value: this.params.armCount,
        type: 'number',
        default: 2,
        min: 2,
        max: 6,
        step: 1,
        description: '螺旋臂数量',
      },
      {
        name: 'tightness',
        value: this.params.tightness,
        type: 'number',
        default: 0.01,
        min: 0.005,
        max: 0.05,
        step: 0.005,
        description: '螺旋紧密度',
      },
      {
        name: 'rotationSpeed',
        value: this.params.rotationSpeed,
        type: 'number',
        default: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        description: '旋转速度',
      },
      {
        name: 'centerBrightness',
        value: this.params.centerBrightness,
        type: 'number',
        default: 1.0,
        min: 0.5,
        max: 2,
        step: 0.1,
        description: '中心亮度',
      },
      {
        name: 'size',
        value: this.params.size,
        type: 'number',
        default: 300,
        min: 100,
        max: 500,
        step: 10,
        description: '星系大小',
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
