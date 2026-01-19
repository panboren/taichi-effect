# Taichi.js 特效引擎 - 大项目架构文档

## 📖 概述

这是一个基于 Taichi.js 的高性能 GPU 特效引擎，采用现代化的架构设计，支持大项目级别的扩展和维护。

## 🏗️ 架构设计

### 核心原则

1. **模块化**: 每个特效独立模块，易于扩展和维护
2. **可配置**: 支持动态参数调整和预设配置
3. **性能优化**: 分层渲染、资源复用、GPU 内存管理
4. **可观测性**: 完整的监控和调试能力
5. **插件化**: 支持特效插件扩展

### 目录结构

```
src/engine/
├── core/                   # 核心模块
│   ├── EffectTypes.ts     # 类型定义和基础接口
│   ├── TaichiEffectEngine.ts  # 主引擎类
│   └── DefaultRenderer.ts # 默认渲染器
├── effects/               # 特效实现
│   ├── FractalEffect.ts   # 分形特效
│   ├── ParticleEffect.ts  # 粒子特效
│   ├── WaveEffect.ts      # 波浪特效
│   ├── FluidEffect.ts     # 流体特效
│   ├── GalaxyEffect.ts    # 星系特效
│   └── NoiseEffect.ts     # 噪声特效
├── index.ts              # 导出文件
└── README.md             # 架构文档
```

## 🎯 核心组件

### 1. 主引擎类 (TaichiEffectEngine)

引擎的核心管理类，负责：

- **生命周期管理**: 初始化、启动、停止、销毁
- **特效切换**: 动态切换不同特效
- **渲染循环**: 高性能动画渲染
- **事件系统**: 完整的事件总线
- **性能监控**: 实时 FPS 监控和自动质量调整
- **参数管理**: 动态参数更新

#### 使用示例

```typescript
import { TaichiEffectEngine, EffectType } from '@/engine'

const engine = new TaichiEffectEngine({
  defaultWidth: 1920,
  defaultHeight: 1080,
  targetFps: 60,
  defaultQuality: RenderQuality.HIGH,
  autoQualityAdjustment: true,
})

await engine.init(canvasElement)
await engine.switchEffect(EffectType.FRACTAL)
engine.start()

// 监听事件
engine.on('fpsUpdate', (fps) => {
  console.log('FPS:', fps)
})
```

### 2. 特效基类 (IEffect)

所有特效必须实现的接口：

```typescript
interface IEffect {
  initialize(ti: any, width: number, height: number): Promise<void>
  createKernel(ti: any, pixels: any, params: Record<string, any>): any
  render(time: number): void
  updateParams(params: Record<string, any>): void
  getParamDefs(): EffectParam[]
  getMetadata(): EffectMetadata
  destroy(): void
}
```

#### 自定义特效示例

```typescript
import { IEffect, EffectType } from '@/engine'

export class CustomEffect implements IEffect {
  async initialize(ti: any, width: number, height: number): Promise<void> {
    // 初始化逻辑
  }

  createKernel(ti: any, pixels: any, params: Record<string, any>): any {
    return ti.kernel((t: any) => {
      // 渲染逻辑
    })
  }

  // ... 其他方法
}
```

### 3. 渲染器 (IRenderer)

负责将像素字段渲染到画布：

```typescript
interface IRenderer {
  render(pixels: any, canvas: HTMLCanvasElement): void
  applyPostProcessing(pixels: any, effects: PostProcessing[]): void
  setQuality(quality: RenderQuality): void
}
```

### 4. 特效注册表 (EffectRegistry)

管理所有可用特效：

```typescript
// 注册特效
EffectRegistry.getInstance().registerEffect(
  EffectType.CUSTOM,
  new CustomEffect(),
  metadata
)

// 获取特效
const effect = EffectRegistry.getInstance().getEffect(EffectType.CUSTOM)

// 搜索特效
const results = EffectRegistry.getInstance().searchEffects('particle')
```

### 5. 配置管理器 (ConfigManager)

管理引擎配置和预设：

```typescript
const configManager = new ConfigManager()

// 保存预设
configManager.savePreset('high-quality', {
  width: 1920,
  height: 1080,
  quality: RenderQuality.ULTRA,
  fps: 60,
})

// 加载预设
const config = configManager.loadPreset('high-quality')
```

### 6. 性能监控器 (PerformanceMonitor)

实时监控性能指标：

```typescript
const monitor = new PerformanceMonitor()

// 获取指标
const metrics = monitor.getMetrics()
// {
//   fps: 60,
//   avgFps: 58.5,
//   minFps: 45,
//   maxFps: 60,
//   frameTime: 16.67,
//   gpuMemory: 12,
//   ...
// }

// 导出报告
const report = monitor.exportReport()
```

## 🎨 内置特效

### 1. 分形特效 (FractalEffect)

基于 Julia Set 的经典分形算法。

**参数**:
- `cReal`: 复数实部 (-2 ~ 2)
- `cImag`: 复数虚部 (-2 ~ 2)
- `zoom`: 缩放比例 (1 ~ 10)
- `maxIterations`: 最大迭代次数 (10 ~ 200)
- `colorOffset`: 颜色偏移 (0 ~ 6.28)
- `animSpeed`: 动画速度 (0 ~ 5)

### 2. 粒子特效 (ParticleEffect)

动态粒子系统，支持多种运动模式。

**参数**:
- `particleCount`: 粒子数量 (10 ~ 500)
- `speed`: 运动速度 (0.1 ~ 3)
- `size`: 粒子大小 (10 ~ 200)
- `orbitRadius`: 轨道半径 (50 ~ 500)
- `intensity`: 颜色强度 (0.1 ~ 2)
- `motionMode`: 运动模式 (circular/spiral/random/wave)

### 3. 波浪特效 (WaveEffect)

多层正弦波叠加，创造流动的视觉效果。

**参数**:
- `waveCount`: 波浪层数 (1 ~ 10)
- `frequency`: 主频率 (1 ~ 50)
- `speed`: 动画速度 (0.1 ~ 10)
- `amplitude`: 振幅 (0.1 ~ 2)
- `colorOffset`: 颜色偏移 (0 ~ 6.28)
- `direction`: 波浪方向 (horizontal/vertical/diagonal/radial)

### 4. 流体特效 (FluidEffect)

基于湍流噪声的流体模拟。

**参数**:
- `frequency`: 噪声频率 (5 ~ 50)
- `speed`: 流动速度 (0.5 ~ 10)
- `turbulence`: 湍流强度 (1 ~ 20)
- `colorSpeed`: 颜色循环速度 (0.1 ~ 5)
- `colorDensity`: 颜色密度 (0.5 ~ 5)

### 5. 星系特效 (GalaxyEffect)

螺旋星系模拟。

**参数**:
- `armCount`: 螺旋臂数量 (2 ~ 6)
- `tightness`: 螺旋紧密度 (0.005 ~ 0.05)
- `rotationSpeed`: 旋转速度 (0.1 ~ 2)
- `centerBrightness`: 中心亮度 (0.5 ~ 2)
- `size`: 星系大小 (100 ~ 500)
- `colorOffset`: 颜色偏移 (0 ~ 6.28)

### 6. 噪声特效 (NoiseEffect)

多层噪声合成，创造自然的纹理效果。

**参数**:
- `frequency`: 基础频率 (10 ~ 200)
- `octaves`: 噪声层数 (1 ~ 8)
- `lacunarity`: 持续度 (1 ~ 4)
- `persistence`: 持久度 (0.1 ~ 0.9)
- `speed`: 动画速度 (0.1 ~ 5)
- `scale`: 缩放 (10 ~ 200)

## 🔧 Vue 集成

### 使用 Composable

```typescript
import { useTaichiEngine } from '@/composables/useTaichiEngine'

const {
  engine,
  isInitialized,
  isRunning,
  currentEffect,
  fps,
  avgFps,
  init,
  start,
  stop,
  switchEffect,
  updateParams,
  setQuality,
} = useTaichiEngine({
  canvasRef: effectCanvas,
  config: {
    defaultWidth: 1920,
    defaultHeight: 1080,
    targetFps: 60,
    defaultQuality: RenderQuality.HIGH,
  },
  defaultEffect: EffectType.FRACTAL,
  autoStart: true,
  autoResize: true,
})

onMounted(async () => {
  await init()
})
```

## 📊 性能优化

### 1. 自动质量调整

引擎会根据当前 FPS 自动调整渲染质量：

```typescript
{
  autoQualityAdjustment: true,
  minFpsThreshold: 30,
}
```

### 2. 渲染质量级别

- `LOW`: 低质量，性能优先 (0.25x 分辨率)
- `MEDIUM`: 中等质量 (0.5x 分辨率)
- `HIGH`: 高质量，平衡性能和效果 (0.75x 分辨率)
- `ULTRA`: 超高质量，效果优先 (1.0x 分辨率)

### 3. 后处理效果

支持多种后处理效果：

- `BLUR`: 模糊
- `SHARPEN`: 锐化
- `BLOOM`: 辉光
- `VIGNETTE`: 晕影
- `CHROMATIC`: 色差
- `FILM_GRAIN`: 胶片颗粒

```typescript
engine.setPostProcessing([PostProcessing.BLOOM, PostProcessing.VIGNETTE])
```

## 🎮 事件系统

引擎提供完整的事件系统：

```typescript
// 订阅事件
engine.on('initialized', (data) => console.log('初始化完成'))
engine.on('started', (data) => console.log('开始播放'))
engine.on('stopped', (data) => console.log('停止播放'))
engine.on('effectChanged', (data) => console.log('特效切换', data.effectType))
engine.on('fpsUpdate', (fps) => console.log('FPS:', fps))
engine.on('paramsUpdated', (params) => console.log('参数更新', params))
engine.on('qualityAdjusted', (data) => console.log('质量调整', data.quality))
engine.on('destroyed', (data) => console.log('引擎销毁'))

// 取消订阅
engine.off('fpsUpdate', callback)

// 只订阅一次
engine.once('initialized', (data) => console.log('只触发一次'))
```

## 🐛 调试模式

启用调试模式以查看详细日志：

```typescript
const engine = new TaichiEffectEngine({
  debugMode: true,
})

// 或在运行时切换
engine.setDebugMode(true)
```

## 📝 最佳实践

### 1. 资源管理

- 使用完毕后及时销毁引擎：`engine.destroy()`
- 在组件卸载时清理资源：`onUnmounted(() => engine?.destroy())`

### 2. 性能优化

- 根据设备性能选择合适的渲染质量
- 避免在动画循环中执行 CPU 密集型操作
- 合理使用特效参数，避免过度渲染

### 3. 自定义特效

- 继承 `IEffect` 接口
- 实现所有必需方法
- 提供完整的参数定义
- 编写清晰的元数据

### 4. 错误处理

```typescript
try {
  await engine.init(canvasElement)
} catch (error) {
  console.error('引擎初始化失败:', error)
  ElMessage.error('初始化失败')
}
```

## 🔮 未来扩展

### 计划中的功能

1. **更多特效类型**
   - 火焰特效
   - 烟雾特效
   - 水波特效
   - 等离子特效

2. **高级后处理**
   - 深度效果
   - 运动模糊
   - 光线追踪

3. **特效组合**
   - 多特效叠加
   - 特效过渡动画
   - 特效链

4. **导出功能**
   - 视频导出
   - 图片导出
   - 预设分享

5. **性能优化**
   - WebWorker 支持
   - 多 GPU 并行
   - 内存池管理

## 📚 参考资料

- [Taichi.js 官方文档](https://taichi-lang.github.io/)
- [Julia Set 算法](https://en.wikipedia.org/wiki/Julia_set)
- [GPU 计算最佳实践](https://developer.nvidia.com/blog/)

## 📄 许可证

MIT License

---

**作者**: Taichi Effect Engine Team
**版本**: 2.0.0
**更新时间**: 2026-01-19
