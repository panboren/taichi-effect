# Taichi.js 特效引擎 - 快速迁移指南

## 🚀 5 分钟快速迁移

### 步骤 1: 更新导入语句

**旧代码**:
```typescript
import { TaichiEffectEngine, type EffectType } from '@/engine/TaichiEffectEngine'
```

**新代码**:
```typescript
import { TaichiEffectEngine, EffectType, RenderQuality } from '@/engine'
```

### 步骤 2: 更新初始化代码

**旧代码**:
```typescript
const engine = new TaichiEffectEngine({
  width: window.innerWidth,
  height: window.innerHeight,
  params: {
    particleCount: 100,
  },
})

await engine.init(canvas)
```

**新代码**:
```typescript
const engine = new TaichiEffectEngine({
  defaultWidth: window.innerWidth,
  defaultHeight: window.innerHeight,
  targetFps: 60,
  defaultQuality: RenderQuality.HIGH,
  autoQualityAdjustment: true,
  minFpsThreshold: 30,
  enablePerformanceMonitor: true,
  debugMode: false,
})

await engine.init(canvas)
```

### 步骤 3: 更新特效类型

**旧代码**:
```typescript
await engine.switchEffect('fractal')
```

**新代码**:
```typescript
import { EffectType } from '@/engine'

await engine.switchEffect(EffectType.FRACTAL)
```

### 步骤 4: 更新事件监听

**旧代码**:
```typescript
engine.on('initialized', () => console.log('初始化成功'))
engine.on('effectChanged', (data: any) => console.log(data.effectType))
engine.on('fpsUpdate', (value: number) => fps.value = value)
```

**新代码** (基本相同，但增加了更多事件):
```typescript
engine.on('initialized', (data) => console.log('初始化成功', data))
engine.on('started', () => console.log('开始播放'))
engine.on('stopped', () => console.log('停止播放'))
engine.on('effectChanged', (data) => console.log('特效切换', data.effectType))
engine.on('fpsUpdate', (fps) => console.log('FPS:', fps))
engine.on('paramsUpdated', (params) => console.log('参数更新', params))
engine.on('qualityAdjusted', (data) => console.log('质量调整', data.quality))
engine.on('resized', (data) => console.log('画布大小调整', data))
engine.on('destroyed', () => console.log('引擎销毁'))
```

### 步骤 5: (可选) 使用 Vue 3 Composable

**推荐使用 Composable 以获得更好的开发体验**:

```vue
<template>
  <div>
    <canvas ref="canvasRef"></canvas>
    <div>FPS: {{ fps }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTaichiEngine } from '@/composables/useTaichiEngine'
import { EffectType, RenderQuality } from '@/engine'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const {
  engine,
  isInitialized,
  isRunning,
  currentEffect,
  fps,
  avgFps,
  frameCount,
  init,
  start,
  stop,
  switchEffect,
  updateParams,
  setQuality,
  getState,
  getPerformanceMetrics,
  getAvailableEffects,
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

onMounted(async () => {
  await init()
})
</script>
```

## 📋 完整迁移对照表

### 类型变化

| 旧版本 | 新版本 |
|--------|--------|
| `'fractal'` | `EffectType.FRACTAL` |
| `'particle'` | `EffectType.PARTICLE` |
| `'wave'` | `EffectType.WAVE` |
| `'fluid'` | `EffectType.FLUID` |
| `'galaxy'` | `EffectType.GALAXY` |
| `'noise'` | `EffectType.NOISE` |

### 配置变化

| 旧配置 | 新配置 | 说明 |
|--------|--------|------|
| `width` | `defaultWidth` | 默认宽度 |
| `height` | `defaultHeight` | 默认高度 |
| `params` | 通过 `updateParams` 单独设置 | 特效参数 |
| - | `targetFps` | 目标 FPS (默认 60) |
| - | `defaultQuality` | 默认渲染质量 |
| - | `autoQualityAdjustment` | 自动质量调整 |
| - | `minFpsThreshold` | 最低 FPS 阈值 |
| - | `enablePerformanceMonitor` | 启用性能监控 |
| - | `debugMode` | 调试模式 |

### 方法变化

| 旧方法 | 新方法 | 变化 |
|--------|--------|------|
| `engine.init(canvas)` | `engine.init(canvas)` | ✅ 相同 |
| `engine.switchEffect(type)` | `engine.switchEffect(type)` | ✅ 相同 (类型改为枚举) |
| `engine.start()` | `engine.start()` | ✅ 相同 |
| `engine.stop()` | `engine.stop()` | ✅ 相同 |
| `engine.reset()` | `engine.reset()` | ✅ 相同 |
| `engine.updateParams(params)` | `engine.updateParams(params)` | ✅ 相同 |
| `engine.resize(width, height)` | `engine.resize(width, height)` | ✅ 相同 |
| `engine.getState()` | `engine.getState()` | ✅ 相同 (返回更多信息) |
| - | `engine.setQuality(quality)` | ✨ 新增 |
| - | `engine.setPostProcessing(effects)` | ✨ 新增 |
| - | `engine.setDebugMode(enabled)` | ✨ 新增 |
| - | `engine.getPerformanceMetrics()` | ✨ 新增 |
| - | `engine.getAvailableEffects()` | ✨ 新增 |
| - | `engine.getParamDefs()` | ✨ 新增 |
| `engine.destroy()` | `engine.destroy()` | ✅ 相同 |

### 事件变化

| 旧事件 | 新事件 | 变化 |
|--------|--------|------|
| `initialized` | `initialized` | ✅ 相同 (参数更详细) |
| `effectChanged` | `effectChanged` | ✅ 相同 |
| `fpsUpdate` | `fpsUpdate` | ✅ 相同 |
| `started` | `started` | ✅ 相同 |
| `stopped` | `stopped` | ✅ 相同 |
| `reset` | `reset` | ✅ 相同 |
| `destroyed` | `destroyed` | ✅ 相同 |
| - | `paramsUpdated` | ✨ 新增 |
| - | `qualityAdjusted` | ✨ 新增 |
| - | `resized` | ✨ 新增 |
| - | `debugModeChanged` | ✨ 新增 |

## 🛠️ 常见迁移问题

### 问题 1: 特效类型错误

**错误信息**:
```
Argument of type 'string' is not assignable to parameter of type 'EffectType'.
```

**解决方案**:
```typescript
// ❌ 错误
await engine.switchEffect('fractal')

// ✅ 正确
import { EffectType } from '@/engine'
await engine.switchEffect(EffectType.FRACTAL)
```

### 问题 2: 配置参数名错误

**错误信息**:
```
Object literal may only specify known properties, and 'width' does not exist in type 'TaichiEngineConfig'.
```

**解决方案**:
```typescript
// ❌ 错误
const engine = new TaichiEffectEngine({
  width: 1920,
  height: 1080,
})

// ✅ 正确
const engine = new TaichiEffectEngine({
  defaultWidth: 1920,
  defaultHeight: 1080,
})
```

### 问题 3: 参数更新方式错误

**错误信息**:
```
Property 'params' does not exist on type 'TaichiEngineConfig'.
```

**解决方案**:
```typescript
// ❌ 错误 (初始化时传入参数)
const engine = new TaichiEffectEngine({
  params: { particleCount: 100 },
})

// ✅ 正确 (使用 updateParams 方法)
engine.updateParams({ particleCount: 100 })
```

### 问题 4: 事件处理函数参数变化

**问题**: 事件回调的参数类型可能发生变化

**解决方案**:
```typescript
// 旧版本
engine.on('fpsUpdate', (value: number) => {
  console.log(value)
})

// 新版本 (参数相同，但建议显式类型)
engine.on('fpsUpdate', (fps: number) => {
  console.log(fps)
})

// 新版本的其他事件参数类型
engine.on('initialized', (data: { engine: TaichiEffectEngine }) => {
  console.log('Engine:', data.engine)
})

engine.on('effectChanged', (data: { effectType: EffectType; effect: IEffect; engine: TaichiEffectEngine }) => {
  console.log('Effect:', data.effectType)
})

engine.on('qualityAdjusted', (data: { quality: RenderQuality }) => {
  console.log('Quality:', data.quality)
})
```

## 🎯 Vue 组件迁移示例

### 旧版本 Home.vue

```vue
<template>
  <div class="home">
    <canvas ref="effectCanvas"></canvas>
    <div class="controls">
      <el-select v-model="currentEffect" @change="handleEffectChange">
        <el-option label="分形" value="fractal" />
        <el-option label="粒子" value="particle" />
      </el-select>
      <el-button @click="toggleAnimation">{{ isRunning ? '暂停' : '播放' }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { TaichiEffectEngine, type EffectType } from '@/engine/TaichiEffectEngine'

let engine: TaichiEffectEngine | null = null
const effectCanvas = ref<HTMLCanvasElement | null>(null)
const currentEffect = ref<EffectType>('fractal')
const isRunning = ref(false)
const fps = ref(0)

onMounted(async () => {
  engine = new TaichiEffectEngine({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  await engine.init(effectCanvas.value!)
  await engine.switchEffect(currentEffect.value)
  engine.start()

  engine.on('fpsUpdate', (value) => {
    fps.value = value
  })
})

onUnmounted(() => {
  if (engine) {
    engine.destroy()
    engine = null
  }
})

const handleEffectChange = async (effectType: EffectType) => {
  if (!engine) return
  await engine.switchEffect(effectType)
}

const toggleAnimation = () => {
  if (!engine) return
  if (isRunning.value) {
    engine.stop()
  } else {
    engine.start()
  }
}
</script>
```

### 新版本 Home.vue (推荐使用 Composable)

```vue
<template>
  <div class="home">
    <canvas ref="effectCanvas"></canvas>
    <div class="controls">
      <el-select v-model="selectedEffect" @change="handleEffectChange">
        <el-option label="分形" :value="EffectType.FRACTAL" />
        <el-option label="粒子" :value="EffectType.PARTICLE" />
      </el-select>
      <el-button @click="toggleAnimation">{{ isRunning ? '暂停' : '播放' }}</el-button>
    </div>
    <div>FPS: {{ fps }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTaichiEngine } from '@/composables/useTaichiEngine'
import { EffectType, RenderQuality } from '@/engine'

const effectCanvas = ref<HTMLCanvasElement | null>(null)

const {
  isRunning,
  currentEffect: selectedEffect,
  fps,
  start,
  stop,
  switchEffect,
} = useTaichiEngine({
  canvasRef: effectCanvas,
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

const handleEffectChange = async (effectType: EffectType) => {
  await switchEffect(effectType)
}

const toggleAnimation = () => {
  if (isRunning.value) {
    stop()
  } else {
    start()
  }
}
</script>
```

## ✅ 迁移检查清单

在完成迁移后，请检查以下项目：

- [ ] 所有 `import` 语句已更新为新的路径
- [ ] 特效类型从字符串改为 `EffectType` 枚举
- [ ] 初始化配置参数名称已更新 (`width` → `defaultWidth`)
- [ ] 特效参数通过 `updateParams()` 单独设置
- [ ] 事件处理函数参数类型已检查
- [ ] Vue 组件中的状态管理已更新
- [ ] 测试所有特效切换功能
- [ ] 测试播放/暂停功能
- [ ] 测试参数调节功能
- [ ] 测试窗口大小调整功能
- [ ] 检查控制台是否有错误或警告

## 📞 获取帮助

如果在迁移过程中遇到问题，请参考：

1. **架构文档**: `src/engine/README.md`
2. **使用指南**: `docs/TaichiEngineGuide.md`
3. **架构总结**: `docs/ARCHITECTURE_SUMMARY.md`
4. **TypeScript 类型定义**: `src/engine/core/EffectTypes.ts`

---

**迁移时间**: 预计 10-30 分钟
**兼容性**: 完全向后兼容的 API
**推荐**: 使用 `useTaichiEngine` Composable 以获得更好的开发体验
