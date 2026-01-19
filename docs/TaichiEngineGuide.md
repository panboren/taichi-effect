# Taichi.js 特效引擎 - 使用指南

## 🚀 快速开始

### 1. 基本使用

```typescript
import { TaichiEffectEngine, EffectType, RenderQuality } from '@/engine'

// 创建引擎实例
const engine = new TaichiEffectEngine({
  defaultWidth: window.innerWidth,
  defaultHeight: window.innerHeight,
  targetFps: 60,
  defaultQuality: RenderQuality.HIGH,
  autoQualityAdjustment: true,
  minFpsThreshold: 30,
})

// 初始化
const canvas = document.getElementById('canvas')
await engine.init(canvas)

// 切换特效
await engine.switchEffect(EffectType.FRACTAL)

// 开始动画
engine.start()
```

### 2. Vue 组件中使用

```vue
<template>
  <div>
    <canvas ref="canvasRef"></canvas>
    <button @click="togglePlay">{{ isPlaying ? '暂停' : '播放' }}</button>
    <select v-model="selectedEffect" @change="handleEffectChange">
      <option value="fractal">分形</option>
      <option value="particle">粒子</option>
      <option value="wave">波浪</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTaichiEngine } from '@/composables/useTaichiEngine'
import { EffectType } from '@/engine'

const canvasRef = ref<HTMLCanvasElement>(null)
const selectedEffect = ref<EffectType>(EffectType.FRACTAL)
const isPlaying = ref(true)

const {
  isRunning,
  fps,
  start,
  stop,
  switchEffect,
} = useTaichiEngine({
  canvasRef: canvasRef,
  config: {
    targetFps: 60,
    defaultQuality: RenderQuality.HIGH,
  },
  defaultEffect: EffectType.FRACTAL,
  autoStart: true,
})

const togglePlay = () => {
  if (isRunning.value) {
    stop()
  } else {
    start()
  }
}

const handleEffectChange = async (effectType: EffectType) => {
  await switchEffect(effectType)
}
</script>
```

## 🎨 特效详解

### 分形特效 (Fractal)

Julia Set 分形，基于复数迭代算法。

```typescript
await engine.switchEffect(EffectType.FRACTAL)

// 更新参数
engine.updateParams({
  cReal: -0.8,
  cImag: 0.2,
  zoom: 3,
  maxIterations: 50,
  colorOffset: 0,
  animSpeed: 1,
})
```

**参数说明**:
- `cReal`: 复数实部，控制分形形状
- `cImag`: 复数虚部，控制分形形状
- `zoom`: 缩放比例，值越大视野越小
- `maxIterations`: 最大迭代次数，影响细节和性能
- `colorOffset`: 颜色偏移，改变整体色调
- `animSpeed`: 动画速度，控制动态变化速度

### 粒子特效 (Particle)

动态粒子系统，支持多种运动模式。

```typescript
await engine.switchEffect(EffectType.PARTICLE)

engine.updateParams({
  particleCount: 100,
  speed: 0.5,
  size: 50,
  orbitRadius: 150,
  intensity: 1.0,
  motionMode: 'circular',
})
```

**运动模式**:
- `circular`: 圆周运动
- `spiral`: 螺旋运动
- `random`: 随机运动
- `wave`: 波浪运动

### 波浪特效 (Wave)

多层正弦波叠加，创造流动效果。

```typescript
await engine.switchEffect(EffectType.WAVE)

engine.updateParams({
  waveCount: 3,
  frequency: 10,
  speed: 2,
  amplitude: 0.5,
  colorOffset: 0,
  direction: 'horizontal',
})
```

**波浪方向**:
- `horizontal`: 水平方向
- `vertical`: 垂直方向
- `diagonal`: 对角方向
- `radial`: 径向扩散

### 流体特效 (Fluid)

基于湍流噪声的有机流动效果。

```typescript
await engine.switchEffect(EffectType.FLUID)

engine.updateParams({
  frequency: 20,
  speed: 3,
  turbulence: 5,
  colorSpeed: 1,
  colorDensity: 1,
})
```

### 星系特效 (Galaxy)

螺旋星系模拟，包含中心光晕和螺旋臂。

```typescript
await engine.switchEffect(EffectType.GALAXY)

engine.updateParams({
  armCount: 2,
  tightness: 0.01,
  rotationSpeed: 0.3,
  centerBrightness: 1.0,
  size: 300,
  colorOffset: 0,
})
```

### 噪声特效 (Noise)

多层噪声合成，创造自然纹理。

```typescript
await engine.switchEffect(EffectType.NOISE)

engine.updateParams({
  frequency: 50,
  octaves: 3,
  lacunarity: 2,
  persistence: 0.5,
  speed: 1,
  scale: 50,
})
```

## 🎛️ 高级功能

### 1. 质量控制

```typescript
// 设置渲染质量
engine.setQuality(RenderQuality.ULTRA)

// 质量级别
// RenderQuality.LOW    - 低质量，性能优先
// RenderQuality.MEDIUM - 中等质量
// RenderQuality.HIGH   - 高质量，平衡性能
// RenderQuality.ULTRA  - 超高质量，效果优先
```

### 2. 后处理效果

```typescript
import { PostProcessing } from '@/engine'

// 设置后处理效果
engine.setPostProcessing([
  PostProcessing.BLOOM,
  PostProcessing.VIGNETTE,
])

// 可用的后处理效果
// PostProcessing.NONE        - 无后处理
// PostProcessing.BLUR        - 模糊
// PostProcessing.SHARPEN     - 锐化
// PostProcessing.BLOOM       - 辉光
// PostProcessing.VIGNETTE    - 晕影
// PostProcessing.CHROMATIC   - 色差
// PostProcessing.FILM_GRAIN  - 胶片颗粒
```

### 3. 性能监控

```typescript
// 获取当前状态
const state = engine.getState()
console.log(state)
// {
//   isRunning: true,
//   currentEffect: 'fractal',
//   frameCount: 1234,
//   fps: 60,
//   avgFps: 58.5,
//   runTime: 20.5,
//   gpuMemory: 12,
//   quality: 'high'
// }

// 获取详细性能指标
const metrics = engine.getPerformanceMetrics()
console.log(metrics)
// {
//   fps: 60,
//   avgFps: 58.5,
//   minFps: 45,
//   maxFps: 60,
//   frameTime: 16.67,
//   avgFrameTime: 17.09,
//   gpuMemory: 12,
//   renderTime: 15.2,
//   totalRenderTime: 18500,
// }
```

### 4. 事件监听

```typescript
// 监听引擎事件
engine.on('initialized', (data) => {
  console.log('引擎初始化完成', data)
})

engine.on('started', () => {
  console.log('动画开始')
})

engine.on('stopped', () => {
  console.log('动画停止')
})

engine.on('effectChanged', (data) => {
  console.log('特效切换到:', data.effectType)
})

engine.on('fpsUpdate', (fps) => {
  console.log('当前 FPS:', fps)
})

engine.on('paramsUpdated', (params) => {
  console.log('参数更新:', params)
})

engine.on('qualityAdjusted', (data) => {
  console.log('质量调整为:', data.quality)
})

engine.on('resized', (data) => {
  console.log('画布大小调整为:', data.width, 'x', data.height)
})

engine.on('destroyed', () => {
  console.log('引擎已销毁')
})

// 取消监听
const fpsCallback = (fps) => console.log(fps)
engine.on('fpsUpdate', fpsCallback)
engine.off('fpsUpdate', fpsCallback)

// 只监听一次
engine.once('initialized', () => {
  console.log('只会触发一次')
})
```

### 5. 自动质量调整

```typescript
// 启用自动质量调整
const engine = new TaichiEffectEngine({
  autoQualityAdjustment: true,
  minFpsThreshold: 30, // FPS 低于 30 时自动降低质量
})

// 当 FPS 低于阈值时，引擎会自动降低质量：
// ULTRA -> HIGH -> MEDIUM -> LOW
```

## 🎯 自定义特效

### 创建自定义特效

```typescript
import type { IEffect, EffectParam, EffectMetadata } from '@/engine/core/EffectTypes'
import { EffectType } from '@/engine/core/EffectTypes'

export class CustomEffect implements IEffect {
  private metadata: EffectMetadata
  private params: Record<string, any> = {}
  private kernel: any = null
  private width: number = 0
  private height: number = 0

  constructor() {
    this.metadata = {
      name: '自定义特效',
      description: '我的自定义特效',
      type: EffectType.CUSTOM,
      createdAt: Date.now(),
      author: 'Your Name',
      version: '1.0.0',
      tags: ['custom', 'unique'],
      performanceRating: 7,
      gpuMemoryUsage: 10,
    }
  }

  async initialize(ti: any, width: number, height: number): Promise<void> {
    this.width = width
    this.height = height
  }

  createKernel(ti: any, pixels: any, params: Record<string, any>): any {
    this.params = { ...this.params, ...params }

    ti.addToKernelScope({
      pixels,
      width: this.width,
      height: this.height,
    })

    return ti.kernel((t: any) => {
      for (let I of ti.ndrange(this.width, this.height)) {
        const i = I[0]
        const j = I[1]

        // 你的渲染逻辑
        const x = i / this.width
        const y = j / this.height

        const r = Math.sin(x * 10 + t)
        const g = Math.sin(y * 10 + t)
        const b = Math.sin((x + y) * 10 + t)

        pixels[(i, j)] = [r * 0.5 + 0.5, g * 0.5 + 0.5, b * 0.5 + 0.5, 1]
      }
    })
  }

  render(time: number): void {
    // 渲染逻辑已在 kernel 中实现
  }

  updateParams(params: Record<string, any>): void {
    this.params = { ...this.params, ...params }
  }

  getParamDefs(): EffectParam[] {
    return [
      {
        name: 'param1',
        value: this.params.param1 || 0,
        type: 'number',
        default: 0,
        min: 0,
        max: 100,
        step: 1,
        description: '参数1描述',
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
```

### 注册自定义特效

```typescript
import { EffectRegistry, EffectType } from '@/engine'

// 注册特效
EffectRegistry.getInstance().registerEffect(
  EffectType.CUSTOM,
  new CustomEffect(),
  {
    name: '自定义特效',
    description: '我的自定义特效',
    type: EffectType.CUSTOM,
    createdAt: Date.now(),
    version: '1.0.0',
    tags: ['custom', 'unique'],
    performanceRating: 7,
  }
)

// 使用自定义特效
await engine.switchEffect(EffectType.CUSTOM)
```

## 💡 最佳实践

### 1. 资源管理

```typescript
// 在组件卸载时清理资源
onUnmounted(() => {
  if (engine) {
    engine.destroy()
  }
})
```

### 2. 性能优化

```typescript
// 根据设备性能选择质量
const isLowEndDevice = navigator.hardwareConcurrency <= 4

const engine = new TaichiEffectEngine({
  defaultQuality: isLowEndDevice ? RenderQuality.LOW : RenderQuality.HIGH,
  autoQualityAdjustment: true,
})
```

### 3. 错误处理

```typescript
try {
  await engine.init(canvas)
  await engine.switchEffect(EffectType.FRACTAL)
  engine.start()
} catch (error) {
  console.error('引擎启动失败:', error)
  ElMessage.error('引擎启动失败，请刷新页面重试')
}
```

### 4. 响应式设计

```typescript
// 监听窗口大小变化
const handleResize = () => {
  if (engine) {
    engine.resize(window.innerWidth, window.innerHeight)
  }
}

window.addEventListener('resize', handleResize)

// 或者使用 composable 的 autoResize 选项
const engine = useTaichiEngine({
  autoResize: true,
})
```

## 🐛 故障排除

### 问题 1: 引擎初始化失败

**原因**: Taichi.js 不支持当前浏览器

**解决方案**:
```typescript
if (!window.WebGL2RenderingContext) {
  ElMessage.error('您的浏览器不支持 WebGL2')
  return
}
```

### 问题 2: FPS 过低

**原因**: 设备性能不足或分辨率过高

**解决方案**:
```typescript
engine.setQuality(RenderQuality.LOW)
engine.updateParams({ maxIterations: 30 })
```

### 问题 3: 特效切换失败

**原因**: 参数格式错误

**解决方案**:
```typescript
// 检查参数类型
const paramDefs = engine.getParamDefs()
console.log(paramDefs)

// 确保参数值在有效范围内
engine.updateParams({
  param1: Math.max(0, Math.min(100, param1)),
})
```

## 📚 参考资料

- [Taichi.js 官方文档](https://taichi-lang.github.io/)
- [GPU 计算最佳实践](https://developer.nvidia.com/blog/)
- [WebGL 性能优化](https://web.dev/performance/)

---

**版本**: 2.0.0
**更新时间**: 2026-01-19
