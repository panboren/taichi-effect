/**
 * 星系特效
 * 螺旋星系模拟
 */

import type { IEffect, EffectParam, EffectMetadata } from '../core/EffectTypes'
import { EffectType } from '../core/EffectTypes'

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
      description: '螺旋星系特效',
      type: EffectType.GALAXY,
      createdAt: Date.now(),
      author: 'Taichi Effect Engine',
      version: '1.0.0',
      tags: ['galaxy', 'spiral', 'space', 'astronomy'],
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

    ti.addToKernelScope({
      pixels,
      width,
      height,
      armCount,
      tightness,
      rotationSpeed,
      centerBrightness,
      size,
      colorOffset,
    })

    return ti.kernel((t: any) => {
      const time = t * rotationSpeed

      // 使用嵌套 for 循环代替 for-of
      for (let i = 0; i < width; i = i + 1) {
        for (let j = 0; j < height; j = j + 1) {
          const x = i - width / 2
          const y = j - height / 2
          const distFromCenter = Math.sqrt(x * x + y * y)

          // 转换为极坐标
          const angle = Math.atan2(y, x)

          // 螺旋公式
          const spiral = angle + time + distFromCenter * tightness

          // 计算螺旋臂
          let armIntensity = 0
          for (let arm = 0; arm < armCount; arm = arm + 1) {
            const armAngle = (arm * 2 * Math.PI) / armCount
            const armDist = Math.abs(spiral - armAngle)
            const normalizedDist = Math.min(armDist, Math.PI * 2 - armDist)
            armIntensity += Math.exp(-normalizedDist * 3)
          }

          // 基于距离的亮度衰减
          const distBrightness = Math.max(0, 1 - distFromCenter / size)
          const centerGlow = Math.exp(-distFromCenter / (size * 0.3)) * centerBrightness

          // 总亮度
          let brightness = armIntensity * distBrightness * 0.8 + centerGlow * 0.2

          // 添加随机星点
          const starPhase = Math.sin(distFromCenter * 50 + spiral * 10) * 0.5 + 0.5
          const starThreshold = 0.98
          if (starPhase > starThreshold) {
            brightness += (starPhase - starThreshold) * 10
          }

          // 计算颜色
          const colorPhase = spiral + colorOffset
          const r = Math.sin(colorPhase) * 0.5 + 0.5
          const g = Math.sin(colorPhase + 2.1) * 0.5 + 0.5
          const b = Math.sin(colorPhase + 4.2) * 0.5 + 0.5

          // 中心偏暖色，外围偏冷色
          const centerColor = 1 - distBrightness
          const finalR = r * (1 - centerColor * 0.5)
          const finalG = g * (1 - centerColor * 0.3)
          const finalB = b + centerColor * 0.3

          pixels[(i, j)] = [
            Math.min(finalR * brightness, 1),
            Math.min(finalG * brightness, 1),
            Math.min(finalB * brightness, 1),
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
