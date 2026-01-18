<template>
  <div class="home">
    <canvas ref="effectCanvas" id="effect-canvas"></canvas>

    <!-- 控制面板 -->
    <div class="controls">
      <el-select
        v-model="currentEffect"
        placeholder="选择特效"
        @change="handleEffectChange"
        style="width: 150px"
      >
        <el-option label="分形" value="fractal" />
        <el-option label="粒子" value="particle" />
        <el-option label="波浪" value="wave" />
        <el-option label="流体" value="fluid" />
        <el-option label="星系" value="galaxy" />
        <el-option label="噪声" value="noise" />
      </el-select>

      <el-button :type="isRunning ? 'danger' : 'primary'" @click="toggleAnimation">
        {{ isRunning ? '暂停' : '播放' }}
      </el-button>

      <el-button @click="resetEngine">重置</el-button>

      <div class="info">
        <span>FPS: {{ fps }}</span>
        <span>帧数: {{ frameCount }}</span>
      </div>
    </div>

    <!-- 参数调节面板 -->
    <div class="params-panel">
      <h4>参数调节</h4>
      <div class="param-item">
        <label>粒子数量:</label>
        <el-slider
          v-model="particleCount"
          :min="10"
          :max="500"
          :step="10"
          @change="handleParamChange"
        />
        <span>{{ particleCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { TaichiEffectEngine, type EffectType } from '@/engine/TaichiEffectEngine'

// 引擎实例
let engine: TaichiEffectEngine | null = null

// 响应式数据
const effectCanvas = ref<HTMLCanvasElement | null>(null)
const currentEffect = ref<EffectType>('fractal')
const isRunning = ref(false)
const fps = ref(0)
const frameCount = ref(0)
const particleCount = ref(100)

// 初始化引擎
const initEngine = async () => {
  if (!effectCanvas.value) {
    ElMessage.error('Canvas 元素不存在')
    return
  }

  engine = new TaichiEffectEngine({
    width: window.innerWidth,
    height: window.innerHeight,
    params: {
      particleCount: particleCount.value,
    },
  })

  const success = await engine.init(effectCanvas.value)
  if (!success) {
    ElMessage.error('引擎初始化失败')
    return
  }

  // 监听引擎事件
  engine.on('initialized', () => {
    console.log('引擎初始化成功')
  })

  engine.on('effectChanged', (data: any) => {
    console.log('特效已切换:', data.effectType)
  })

  engine.on('fpsUpdate', (value: number) => {
    fps.value = value
  })

  engine.on('started', () => {
    isRunning.value = true
  })

  engine.on('stopped', () => {
    isRunning.value = false
  })

  engine.on('reset', () => {
    frameCount.value = 0
  })

  engine.on('destroyed', () => {
    console.log('引擎已销毁')
  })

  // 切换到默认特效
  await engine.switchEffect(currentEffect.value)

  // 启动动画
  engine.start()
}

// 切换特效
const handleEffectChange = async (effectType: EffectType) => {
  if (!engine) return

  await engine.switchEffect(effectType)

  // 更新参数
  updateFrameCount()
}

// 切换动画播放状态
const toggleAnimation = () => {
  if (!engine) return

  if (isRunning.value) {
    engine.stop()
  } else {
    engine.start()
  }
}

// 重置引擎
const resetEngine = () => {
  if (!engine) return

  engine.reset()
  frameCount.value = 0
  ElMessage.success('引擎已重置')
}

// 处理参数变化
const handleParamChange = () => {
  if (!engine) return

  engine.updateParams({
    particleCount: particleCount.value,
  })

  // 重新创建 kernel
  engine.switchEffect(currentEffect.value)

  ElMessage.success(`粒子数量: ${particleCount.value}`)
}

// 更新帧数
const updateFrameCount = () => {
  if (!engine) return

  const state = engine.getState()
  frameCount.value = state.frameCount
}

// 处理窗口大小变化
const handleResize = () => {
  if (!engine) return

  engine.resize(window.innerWidth, window.innerHeight)
}

// 定时更新帧数显示
let frameCountInterval: number | null = null

onMounted(async () => {
  await initEngine()

  // 每秒更新一次帧数显示
  frameCountInterval = window.setInterval(() => {
    updateFrameCount()
  }, 1000)

  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (frameCountInterval) {
    clearInterval(frameCountInterval)
  }

  window.removeEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (engine) {
    engine.destroy()
    engine = null
  }
})
</script>

<style scoped lang="scss">
.home {
  width: 100vw;
  height: 100vh;
  padding: 0;
  overflow: hidden;
  position: relative;
  background: #000;

  #effect-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .controls {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 12px 20px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);

    .info {
      display: flex;
      gap: 20px;
      color: #fff;
      font-size: 14px;
      font-family: monospace;

      span {
        background: rgba(0, 0, 0, 0.3);
        padding: 4px 8px;
        border-radius: 4px;
      }
    }
  }

  .params-panel {
    position: absolute;
    top: 80px;
    right: 20px;
    width: 280px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;

    h4 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }

    .param-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;

      label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
      }

      span {
        text-align: right;
        font-size: 12px;
        font-family: monospace;
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
}
</style>

