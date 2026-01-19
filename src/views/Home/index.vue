<template>
  <div class="home">
    <!-- 特效画布 -->
    <canvas ref="effectCanvas" id="effect-canvas"></canvas>

    <!-- 控制面板 -->
    <div class="controls">
      <!-- 特效选择 -->
      <el-select
        v-model="selectedEffect"
        placeholder="选择特效"
        @change="handleEffectChange"
        style="width: 150px"
      >
        <el-option
          v-for="effect in availableEffects"
          :key="effect"
          :label="getEffectLabel(effect)"
          :value="effect"
        />
      </el-select>

      <!-- 播放/暂停 -->
      <el-button :type="isRunning ? 'danger' : 'primary'" @click="toggleAnimation">
        {{ isRunning ? '暂停' : '播放' }}
      </el-button>

      <!-- 重置 -->
      <el-button @click="resetEngine">重置</el-button>

      <!-- 质量选择 -->
      <el-select v-model="selectedQuality" @change="handleQualityChange" style="width: 120px">
        <el-option label="低" :value="RenderQuality.LOW" />
        <el-option label="中" :value="RenderQuality.MEDIUM" />
        <el-option label="高" :value="RenderQuality.HIGH" />
        <el-option label="超高" :value="RenderQuality.ULTRA" />
      </el-select>

      <!-- 性能信息 -->
      <div class="info">
        <span>FPS: {{ fps }}</span>
        <span>平均 FPS: {{ avgFps }}</span>
        <span>帧数: {{ frameCount }}</span>
        <span>运行时间: {{ formatTime(runTime) }}</span>
      </div>
    </div>

    <!-- 参数面板 -->
    <div class="params-panel" v-if="paramDefs.length > 0">
      <h4>参数调节</h4>
      <div class="param-item" v-for="param in paramDefs" :key="param.name">
        <label>{{ param.name }} ({{ param.description }})</label>
        <el-slider
          v-if="param.type === 'number'"
          v-model="paramValues[param.name]"
          :min="param.min ?? 0"
          :max="param.max ?? 100"
          :step="param.step ?? 1"
          @change="handleParamChange(param.name, $event)"
        />
        <el-select
          v-else-if="param.type === 'string'"
          v-model="paramValues[param.name]"
          @change="handleParamChange(param.name, $event)"
          style="width: 100%"
        >
          <el-option
            v-for="option in getParamOptions(param)"
            :key="option"
            :label="option"
            :value="option"
          />
        </el-select>
        <span class="param-value">{{ formatParamValue(paramValues[param.name]) }}</span>
      </div>
    </div>

    <!-- 性能面板 -->
    <div class="performance-panel">
      <h4>性能监控</h4>
      <div class="perf-item">
        <span>当前 FPS</span>
        <span :class="getFpsClass(fps)">{{ fps }}</span>
      </div>
      <div class="perf-item">
        <span>平均 FPS</span>
        <span>{{ avgFps }}</span>
      </div>
      <div class="perf-item">
        <span>帧时间</span>
        <span>{{ (1000 / fps).toFixed(2) }}ms</span>
      </div>
      <div class="perf-item">
        <span>总帧数</span>
        <span>{{ frameCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useTaichiEngine } from '@/composables/useTaichiEngine'
import { EffectType, RenderQuality } from '@/engine'

// ============================================================================
// 引擎初始化
// ============================================================================

const effectCanvas = ref<HTMLCanvasElement | null>(null)

const {
  engine,
  isInitialized,
  isRunning,
  currentEffect,
  fps,
  avgFps,
  frameCount,
  runTime,
  init,
  start,
  stop,
  reset,
  destroy,
  switchEffect,
  updateParams,
  getParamDefs,
  setQuality,
  getState,
  getPerformanceMetrics,
  getAvailableEffects,
  resize,
} = useTaichiEngine({
  canvasRef: effectCanvas,
  config: {
    defaultWidth: window.innerWidth,
    defaultHeight: window.innerHeight,
    targetFps: 60,
    defaultQuality: RenderQuality.HIGH,
    autoQualityAdjustment: true,
    minFpsThreshold: 30,
    enablePerformanceMonitor: true,
    debugMode: false,
  },
  defaultEffect: EffectType.FRACTAL,
  autoStart: true,
  autoResize: true,
})

// ============================================================================
// 响应式状态
// ============================================================================

const selectedEffect = ref<EffectType>(EffectType.FRACTAL)
const selectedQuality = ref<RenderQuality>(RenderQuality.HIGH)
const availableEffects = ref<EffectType[]>([])
const paramDefs = ref<any[]>([])
const paramValues = ref<Record<string, any>>({})

// ============================================================================
// 初始化
// ============================================================================

onMounted(async () => {
  await init()

  if (isInitialized.value) {
    availableEffects.value = getAvailableEffects()
    refreshParamDefs()
  }
})

// ============================================================================
// 特效控制
// ============================================================================

const handleEffectChange = async (effectType: EffectType) => {
  selectedEffect.value = effectType
  await switchEffect(effectType)
  refreshParamDefs()
  ElMessage.success(`切换到特效: ${getEffectLabel(effectType)}`)
}

const toggleAnimation = () => {
  if (isRunning.value) {
    stop()
  } else {
    start()
  }
}

const resetEngine = () => {
  reset()
  ElMessage.success('引擎已重置')
}

const handleQualityChange = (quality: RenderQuality) => {
  selectedQuality.value = quality
  setQuality(quality)
  ElMessage.success(`渲染质量: ${quality}`)
}

// ============================================================================
// 参数管理
// ============================================================================

const refreshParamDefs = () => {
  paramDefs.value = getParamDefs()
  paramValues.value = {}

  // 初始化参数值
  paramDefs.value.forEach((param) => {
    paramValues.value[param.name] = param.value
  })
}

const handleParamChange = (name: string, value: any) => {
  updateParams({ [name]: value })
}

const getParamOptions = (param: any): string[] => {
  if (param.description?.includes('(')) {
    const match = param.description.match(/\(([^)]+)\)/)
    return match ? match[1].split('/') : []
  }
  return []
}

const formatParamValue = (value: any): string => {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return String(value)
}

// ============================================================================
// 工具方法
// ============================================================================

const getEffectLabel = (effect: EffectType): string => {
  const labels: Record<EffectType, string> = {
    [EffectType.FRACTAL]: '分形',
    [EffectType.PARTICLE]: '粒子',
    [EffectType.WAVE]: '波浪',
    [EffectType.FLUID]: '流体',
    [EffectType.GALAXY]: '星系',
    [EffectType.NOISE]: '噪声',
    [EffectType.CUSTOM]: '自定义',
  }
  return labels[effect] || effect
}

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getFpsClass = (fps: number): string => {
  if (fps >= 55) return 'fps-good'
  if (fps >= 30) return 'fps-medium'
  return 'fps-poor'
}
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
    width: 320px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    max-height: calc(100vh - 120px);
    overflow-y: auto;

    h4 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 10px;
    }

    .param-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;

      label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
      }

      .param-value {
        text-align: right;
        font-size: 12px;
        font-family: monospace;
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  .performance-panel {
    position: absolute;
    bottom: 20px;
    left: 20px;
    width: 240px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .perf-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;

      span:first-child {
        color: rgba(255, 255, 255, 0.7);
      }

      span:last-child {
        font-family: monospace;

        &.fps-good {
          color: #67c23a;
        }

        &.fps-medium {
          color: #e6a23c;
        }

        &.fps-poor {
          color: #f56c6c;
        }
      }
    }
  }
}
</style>
