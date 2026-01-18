<!--
  图片预览组件
  支持缩放、旋转、翻转
-->

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { ElImageViewer } from 'element-plus'

interface Props {
  // 图片列表
  srcList: string[]
  // 初始索引
  initialIndex?: number
  // 是否显示
  modelValue: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  switch: [index: number]
  close: []
}>()

const currentIndex = ref(props.initialIndex)
const scale = ref(1)
const rotate = ref(0)
const isFlippedX = ref(false)
const isFlippedY = ref(false)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const translateX = ref(0)
const translateY = ref(0)

const currentSrc = computed(() => props.srcList[currentIndex.value])
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.srcList.length - 1)

/**
 * 上一张
 */
const prev = () => {
  if (hasPrev.value) {
    currentIndex.value--
    resetTransform()
    emit('switch', currentIndex.value)
  }
}

/**
 * 下一张
 */
const next = () => {
  if (hasNext.value) {
    currentIndex.value++
    resetTransform()
    emit('switch', currentIndex.value)
  }
}

/**
 * 缩放
 */
const handleZoom = (delta: number) => {
  scale.value = Math.max(0.1, Math.min(5, scale.value + delta))
}

/**
 * 旋转
 */
const handleRotate = () => {
  rotate.value += 90
}

/**
 * 翻转
 */
const handleFlip = (direction: 'x' | 'y') => {
  if (direction === 'x') {
    isFlippedX.value = !isFlippedX.value
  } else {
    isFlippedY.value = !isFlippedY.value
  }
}

/**
 * 重置变换
 */
const resetTransform = () => {
  scale.value = 1
  rotate.value = 0
  isFlippedX.value = false
  isFlippedY.value = false
  translateX.value = 0
  translateY.value = 0
}

/**
 * 拖拽开始
 */
const handleDragStart = (e: MouseEvent) => {
  if (scale.value > 1) {
    isDragging.value = true
    startX.value = e.clientX - translateX.value
    startY.value = e.clientY - translateY.value
  }
}

/**
 * 拖拽中
 */
const handleDragMove = (e: MouseEvent) => {
  if (isDragging.value) {
    translateX.value = e.clientX - startX.value
    translateY.value = e.clientY - startY.value
  }
}

/**
 * 拖拽结束
 */
const handleDragEnd = () => {
  isDragging.value = false
}

/**
 * 滚轮缩放
 */
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  handleZoom(delta)
}

/**
 * 关闭
 */
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

/**
 * 键盘事件
 */
const handleKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowLeft':
      prev()
      break
    case 'ArrowRight':
      next()
      break
    case 'Escape':
      handleClose()
      break
    case '+':
    case '=':
      handleZoom(0.2)
      break
    case '-':
      handleZoom(-0.2)
      break
    case 'r':
      handleRotate()
      break
  }
}

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('keydown', handleKeydown)
    }
  }
)

onMounted(() => {
  if (props.modelValue) {
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :show-close="false"
    :modal="true"
    :append-to-body="true"
    class="image-preview-dialog"
    @close="handleClose"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <div class="image-preview-container" @wheel="handleWheel">
      <!-- 图片 -->
      <div
        class="image-preview-wrapper"
        :style="{
          transform: `scale(${scale}) rotate(${rotate}deg) scaleX(${isFlippedX ? -1 : 1}) scaleY(${isFlippedY ? -1 : 1}) translate(${translateX}px, ${translateY}px)`
        }"
        @mousedown="handleDragStart"
        @mousemove="handleDragMove"
        @mouseup="handleDragEnd"
        @mouseleave="handleDragEnd"
      >
        <img :src="currentSrc" alt="preview" class="image-preview-img" draggable="false" />
      </div>

      <!-- 工具栏 -->
      <div class="image-preview-toolbar">
        <el-button-group>
          <el-button @click="handleZoom(-0.2)" title="缩小">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button @click="resetTransform" title="重置">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
          <el-button @click="handleZoom(0.2)" title="放大">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
        </el-button-group>

        <el-button-group>
          <el-button @click="handleRotate" title="旋转">
            <el-icon><RefreshLeft /></el-icon>
          </el-button>
          <el-button @click="handleFlip('x')" title="水平翻转">
            <el-icon><Sort /></el-icon>
          </el-button>
          <el-button @click="handleFlip('y')" title="垂直翻转">
            <el-icon><TopRight /></el-icon>
          </el-button>
        </el-button-group>

        <el-button @click="handleClose" title="关闭 (ESC)">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <!-- 导航按钮 -->
      <el-button
        v-if="hasPrev"
        class="image-preview-prev"
        circle
        size="large"
        @click="prev"
      >
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <el-button
        v-if="hasNext"
        class="image-preview-next"
        circle
        size="large"
        @click="next"
      >
        <el-icon><ArrowRight /></el-icon>
      </el-button>

      <!-- 页码指示器 -->
      <div class="image-preview-counter">
        {{ currentIndex + 1 }} / {{ srcList.length }}
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.image-preview-dialog {
  :deep(.el-dialog) {
    background: transparent;
    box-shadow: none;
    padding: 0;
  }

  :deep(.el-dialog__header) {
    display: none;
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.image-preview-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  overflow: hidden;
}

.image-preview-wrapper {
  transition: transform 0.1s ease;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.image-preview-img {
  max-width: 100%;
  max-height: 100vh;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}

.image-preview-toolbar {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.image-preview-prev,
.image-preview-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: none;
  color: white;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.image-preview-prev {
  left: 32px;
}

.image-preview-next {
  right: 32px;
}

.image-preview-counter {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 16px;
}
</style>
