/**
 * Taichi.js 特效引擎 - 导出文件
 * 大项目架构优化版
 */

// ============================================================================
// 核心引擎
// ============================================================================
export { TaichiEffectEngine } from './core/TaichiEffectEngine'
export type { TaichiEngineConfig } from './core/TaichiEffectEngine'

// ============================================================================
// 渲染器
// ============================================================================
export { DefaultRenderer, AdvancedRenderer } from './core/DefaultRenderer'
export type { IRenderer } from './core/EffectTypes'

// ============================================================================
// 特效类
// ============================================================================
export { FractalEffect } from './effects/FractalEffect'
export { ParticleEffect } from './effects/ParticleEffect'
export { WaveEffect } from './effects/WaveEffect'
export { FluidEffect } from './effects/FluidEffect'
export { GalaxyEffect } from './effects/GalaxyEffect'
export { NoiseEffect } from './effects/NoiseEffect'
export { PlasmaEffect } from './effects/PlasmaEffect'
export { FireEffect } from './effects/FireEffect'
export { DustEffect } from './effects/DustEffect'

// ============================================================================
// 枚举
// ============================================================================
export {
  EffectType,
  RenderQuality,
  PostProcessing,
} from './core/EffectTypes'

// ============================================================================
// 类型定义
// ============================================================================
export type {
  EffectMetadata,
  EffectParam,
  EffectConfig,
  EffectState,
  PerformanceMetrics,
  EngineConfig,
  IEffect,
  IPerformanceMonitor,
  IEventBus,
} from './core/EffectTypes'

// ============================================================================
// 工具类
// ============================================================================
export {
  EffectRegistry,
  ConfigManager,
  EventBus,
  PerformanceMonitor,
} from './core/EffectTypes'

// ============================================================================
// 参数类型
// ============================================================================
export type { FractalParams } from './effects/FractalEffect'
export type { ParticleParams } from './effects/ParticleEffect'
export type { WaveParams } from './effects/WaveEffect'
export type { FluidParams } from './effects/FluidEffect'
export type { GalaxyParams } from './effects/GalaxyEffect'
export type { NoiseParams } from './effects/NoiseEffect'
export type { PlasmaParams } from './effects/PlasmaEffect'
export type { FireParams } from './effects/FireEffect'
export type { DustParams } from './effects/DustEffect'

// 优化组件
export { KernelCache } from './core/KernelCache'
export { MemoryPool } from './core/MemoryPool'
export { OptimizedRenderer } from './optimizations/OptimizedRenderer'
