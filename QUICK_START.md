# Taichi.js 特效引擎 - 5 分钟快速开始

## 🚀 快速安装

### 步骤 1: 确认依赖

项目已包含 `taichi.js` 依赖，无需额外安装。

```bash
# 检查 package.json
cat package.json | grep taichi.js
# 输出: "taichi.js": "^0.0.36"
```

### 步骤 2: 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或者使用 mock 模式
npm run dev:mock
```

## 📖 基本使用

### 方式 1: 使用 Composable (推荐)

```vue
<template>
  <div class="app">
    <!-- 画布 -->
    <canvas ref="canvasRef"></canvas>

    <!-- 控制面板 -->
    <div class="controls">
      <button @click="togglePlay">
        {{ isRunning ? '暂停' : '播放' }}
      </button>

      <select v-model="selectedEffect" @change="changeEffect">
        <option value="fractal">分形</option>
        <option value="particle">粒子</option>
        <option value="wave">波浪</option>
        <option value="fluid">流体</option>
        <option value="galaxy">星系</option>
        <option value="noise">噪声</option>
      </select>

      <div>FPS: {{ fps }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTaichiEngine } from '@/composables/useTaichiEngine'
import { EffectType, RenderQuality } from '@/engine'

// 画布引用
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 使用引擎 Composable
const {
  isRunning,
  fps,
  start,
  stop,
  switchEffect,
} = useTaichiEngine({
  canvasRef: canvasRef,
  config: {
    defaultWidth: window.innerWidth,
    defaultHeight: window.innerHeight,
    targetFps: 60,
    defaultQuality: RenderQuality.HIGH,
    autoQualityAdjustment: true,
  },
  defaultEffect: EffectType.FRACTAL,
  autoStart: true,
  autoResize: true,
})

const selectedEffect = ref<EffectType>(EffectType.FRACTAL)

// 切换播放状态
const togglePlay = () => {
  if (isRunning.value) {
    stop()
  } else {
    start()
  }
}

// 切换特效
const changeEffect = async () => {
  await switchEffect(selectedEffect.value)
}
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #000;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.controls {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 8px;
  color: #fff;
  display: flex;
  gap: 12px;
  align-items: center;
}

button, select {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}
</style>
```

### 方式 2: 直接使用引擎类

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { TaichiEffectEngine, EffectType, RenderQuality } from '@/engine'

// 引擎实例
let engine: TaichiEffectEngine | null = null

// 画布引用
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 状态
const isRunning = ref(false)
const fps = ref(0)
const currentEffect = ref<EffectType>(EffectType.FRACTAL)

// 初始化
onMounted(async () => {
  // 创建引擎
  engine = new TaichiEffectEngine({
    defaultWidth: window.innerWidth,
    defaultHeight: window.innerHeight,
    targetFps: 60,
    defaultQuality: RenderQuality.HIGH,
    autoQualityAdjustment: true,
    enablePerformanceMonitor: true,
  })

  // 初始化引擎
  await engine.init(canvasRef.value!)

  // 切换特效
  await engine.switchEffect(EffectType.FRACTAL)

  // 监听 FPS
  engine.on('fpsUpdate', (value) => {
    fps.value = value
  })

  // 开始动画
  engine.start()
  isRunning.value = true
})

// 清理
onUnmounted(() => {
  if (engine) {
    engine.destroy()
    engine = null
  }
})

// 切换特效
const switchEffect = async (type: EffectType) => {
  if (!engine) return

  await engine.switchEffect(type)
  currentEffect.value = type
}

// 切换播放
const togglePlay = () => {
  if (!engine) return

  if (isRunning.value) {
    engine.stop()
  } else {
    engine.start()
  }
  isRunning.value = !isRunning.value
}
</script>
```

## 🎨 特效示例

### 分形特效 (Fractal)

```typescript
import { EffectType } from '@/engine'

await engine.switchEffect(EffectType.FRACTAL)

// 调整参数
engine.updateParams({
  cReal: -0.8,
  cImag: 0.2,
  zoom: 3,
  maxIterations: 50,
  colorOffset: 0,
  animSpeed: 1,
})
```

### 粒子特效 (Particle)

```typescript
await engine.switchEffect(EffectType.PARTICLE)

engine.updateParams({
  particleCount: 100,
  speed: 0.5,
  size: 50,
  orbitRadius: 150,
  intensity: 1.0,
  motionMode: 'circular', // circular/spiral/random/wave
})
```

### 波浪特效 (Wave)

```typescript
await engine.switchEffect(EffectType.WAVE)

engine.updateParams({
  waveCount: 3,
  frequency: 10,
  speed: 2,
  amplitude: 0.5,
  direction: 'horizontal', // horizontal/vertical/diagonal/radial
})
```

## 🎛️ 质量控制

```typescript
import { RenderQuality } from '@/engine'

// 设置渲染质量
engine.setQuality(RenderQuality.ULTRA)

// 质量级别:
// RenderQuality.LOW    - 低质量 (0.25x 分辨率)
// RenderQuality.MEDIUM - 中等质量 (0.5x 分辨率)
// RenderQuality.HIGH   - 高质量 (0.75x 分辨率)
// RenderQuality.ULTRA  - 超高质量 (1.0x 分辨率)
```

## 📊 性能监控

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
//   renderTime: 15.2,
//   ...
// }
```

## 🎯 事件监听

```typescript
// 初始化完成
engine.on('initialized', (data) => {
  console.log('引擎初始化完成', data)
})

// 开始播放
engine.on('started', () => {
  console.log('动画开始')
})

// 停止播放
engine.on('stopped', () => {
  console.log('动画停止')
})

// 特效切换
engine.on('effectChanged', (data) => {
  console.log('特效切换到:', data.effectType)
})

// FPS 更新
engine.on('fpsUpdate', (fps) => {
  console.log('当前 FPS:', fps)
})

// 参数更新
engine.on('paramsUpdated', (params) => {
  console.log('参数更新:', params)
})

// 质量调整
engine.on('qualityAdjusted', (data) => {
  console.log('质量调整为:', data.quality)
})

// 引擎销毁
engine.on('destroyed', () => {
  console.log('引擎已销毁')
})
```

## 🔧 高级功能

### 后处理效果

```typescript
import { PostProcessing } from '@/engine'

// 设置后处理效果
engine.setPostProcessing([
  PostProcessing.BLOOM,      // 辉光
  PostProcessing.VIGNETTE,   // 晕影
  PostProcessing.BLUR,      // 模糊
])
```

### 调试模式

```typescript
// 启用调试模式
engine.setDebugMode(true)

// 查看详细日志
// [TaichiEngine] Initializing engine...
// [TaichiEngine] Initializing Taichi.js...
// [TaichiEngine] Created pixel field: 1920x1080
// ...
```

### 自定义特效

```typescript
// 1. 创建特效类
import { IEffect, EffectMetadata, EffectType } from '@/engine'

export class MyEffect implements IEffect {
  async initialize(ti: any, width: number, height: number): Promise<void> {
    // 初始化逻辑
  }

  createKernel(ti: any, pixels: any, params: any): any {
    return ti.kernel((t: any) => {
      // 渲染逻辑
    })
  }

  render(time: number): void {}
  updateParams(params: any): void {}
  getParamDefs(): any[] { return [] }
  getMetadata(): EffectMetadata { return { ... } }
  destroy(): void {}
}

// 2. 注册特效
import { EffectRegistry } from '@/engine'

EffectRegistry.getInstance().registerEffect(
  EffectType.CUSTOM,
  new MyEffect()
)

// 3. 使用特效
await engine.switchEffect(EffectType.CUSTOM)
```

## 📚 更多资源

### 文档
- [完整使用指南](./docs/TaichiEngineGuide.md)
- [架构文档](./src/engine/README.md)
- [迁移指南](./docs/MIGRATION_GUIDE.md)
- [架构总结](./docs/ARCHITECTURE_SUMMARY.md)

### 示例
- [Home.vue](./src/views/Home/index.vue) - 完整示例组件
- [useTaichiEngine](./src/composables/useTaichiEngine.ts) - Composable 实现

## 🐛 常见问题

### Q: 浏览器不支持 WebGL2？

```typescript
if (!window.WebGL2RenderingContext) {
  alert('您的浏览器不支持 WebGL2')
  return
}
```

### Q: FPS 过低？

```typescript
// 降低渲染质量
engine.setQuality(RenderQuality.LOW)

// 减少特效复杂度
engine.updateParams({ maxIterations: 30 })
```

### Q: 如何获取可用特效列表？

```typescript
const effects = engine.getAvailableEffects()
console.log(effects)
// ['fractal', 'particle', 'wave', 'fluid', 'galaxy', 'noise']
```

## 🎉 开始创作吧！

现在你已经掌握了基本用法，可以开始创作自己的特效了！

祝你创作愉快！ 🚀

---

**版本**: 2.0.0
**更新时间**: 2026-01-19
