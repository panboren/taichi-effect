/**
 * Taichi.js 优化助手
 * 提供常用优化常量（Taichi.js kernel scope 不支持复杂函数定义）
 */

export class TaichiOptimizedKernel {
  /**
   * 设置优化后的 kernel scope
   * 注意：Taichi.js 的 kernel scope 不支持复杂函数定义和闭包
   * 只添加简单的数学常量和内联值
   */
  static setupOptimizedScope(ti: any): void {
    ti.addToKernelScope({
      // 数学常量
      PI: Math.PI,
      PI2: Math.PI * 2,
      HALF_PI: Math.PI * 0.5,
      QUARTER_PI: Math.PI * 0.25,
      INV_PI: 1.0 / Math.PI,
      E: Math.E,
      SQRT2: Math.SQRT2,
      SQRT3: Math.sqrt(3),
      GOLDEN_RATIO: (1 + Math.sqrt(5)) / 2,

      // 常用转换常量
      DEG_TO_RAD: 0.017453292519943295,
      RAD_TO_DEG: 57.29577951308232,
    })
  }

  /**
   * clamp 函数 - 直接内联使用，不放入 kernel scope
   */
  static clamp(x: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, x))
  }

  /**
   * lerp 函数 - 直接内联使用
   */
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  /**
   * 创建优化的像素字段
   */
  static createOptimizedPixels(ti: any, width: number, height: number): any {
    return ti.Vector.field(4, ti.f32, [width, height])
  }

  /**
   * 预计算常用的尺寸相关常量
   */
  static createSizeConstants(width: number, height: number): Record<string, number> {
    return {
      width,
      height,
      invWidth: 1.0 / width,
      invHeight: 1.0 / height,
      halfWidth: width * 0.5,
      halfHeight: height * 0.5,
      centerX: width * 0.5,
      centerY: height * 0.5,
    }
  }

  /**
   * 优化后的颜色混合函数
   */
  static colorMix(color1: number[], color2: number[], t: number): number[] {
    const mt = 1 - t
    return [
      color1[0] * mt + color2[0] * t,
      color1[1] * mt + color2[1] * t,
      color1[2] * mt + color2[2] * t,
      color1[3] * mt + color2[3] * t,
    ]
  }
}

// 导出常量
export const OPTIMIZATION_CONSTANTS = {
  // 颜色相位偏移（优化计算）
  COLOR_PHASE_0: 0,
  COLOR_PHASE_1: 2.0943951023931953, // 2 * PI / 3
  COLOR_PHASE_2: 4.1887902047863905, // 4 * PI / 3

  // 常用角度
  ANGLE_45: 0.7853981633974483,
  ANGLE_90: 1.5707963267948966,
  ANGLE_180: 3.141592653589793,

  // 性能常量
  MAX_ITERATIONS_FRACTAL: 50,
  MAX_PARTICLES: 1000,
  NOISE_OCTAVES_DEFAULT: 3,
}
