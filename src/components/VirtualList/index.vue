<!--
  虚拟列表组件
  用于渲染大量数据时优化性能
-->

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useVirtualList } from '@/hooks/core/useVirtualList'

interface Props<T = any> {
  // 数据源
  data: T[]
  // 每项高度
  itemHeight?: number
  // 容器高度
  height?: number
  // 缓冲区数量
  bufferSize?: number
  // 获取动态高度
  getItemHeight?: (item: T, index: number) => number
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 50,
  height: 500,
  bufferSize: 5
})

const emit = defineEmits<{
  scroll: [e: Event]
  scrollEnd: []
}>()

const containerRef = ref<HTMLElement | null>(null)

const {
  visibleData,
  startIndex,
  endIndex,
  totalHeight,
  offsetY,
  onScroll,
  scrollToIndex,
  scrollTo: scrollToTop
} = useVirtualList({
  dataSource: computed(() => props.data),
  itemHeight: props.itemHeight,
  containerHeight: props.height,
  bufferSize: props.bufferSize,
  getItemHeight: props.getItemHeight
})

const transformY = computed(() => `translateY(${offsetY.value}px)`)

/**
 * 滚动处理
 */
const handleScroll = (e: Event) => {
  onScroll(e)
  emit('scroll', e)

  // 检测是否滚动到底部
  const target = e.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    emit('scrollEnd')
  }
}

/**
 * 暴露方法
 */
defineExpose({
  scrollToIndex,
  scrollTo: scrollToTop,
  containerRef
})

// 监听数据变化
watch(
  () => props.data,
  () => {
    // 数据变化时可以重置滚动位置
  }
)
</script>

<template>
  <div
    ref="containerRef"
    class="virtual-list-container"
    :style="{ height: `${height}px` }"
    @scroll="handleScroll"
  >
    <div class="virtual-list-phantom" :style="{ height: `${totalHeight}px` }"></div>
    <div class="virtual-list-content" :style="{ transform: transformY }">
      <div
        v-for="(item, index) in visibleData"
        :key="startIndex + index"
        class="virtual-list-item"
        :style="{ height: `${itemHeight}px` }"
      >
        <slot :item="item" :index="startIndex + index"></slot>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="visibleData.length === 0 && data.length > 0" class="virtual-list-loading">
      <slot name="loading">
        <span>加载中...</span>
      </slot>
    </div>

    <!-- 空状态 -->
    <div v-if="data.length === 0" class="virtual-list-empty">
      <slot name="empty">
        <span>暂无数据</span>
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.virtual-list-container {
  position: relative;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-list-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.virtual-list-item {
  position: absolute;
  left: 0;
  right: 0;
}

.virtual-list-loading,
.virtual-list-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
}
</style>
