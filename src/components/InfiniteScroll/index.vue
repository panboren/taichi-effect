<!--
  无限滚动组件
  自动检测滚动到底部并加载更多
-->

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { throttle } from 'lodash-es'

interface Props {
  // 是否禁用
  disabled?: boolean
  // 距离底部多少像素触发加载
  distance?: number
  // 是否立即检测
  immediate?: boolean
  // 是否垂直滚动（false 为水平滚动）
  vertical?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  distance: 100,
  immediate: true,
  vertical: true
})

const emit = defineEmits<{
  load: []
}>()

const loading = ref(false)
const observerTarget = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let container: HTMLElement | Window | null = null

/**
 * 使用 IntersectionObserver
 */
const initObserver = () => {
  if (!observerTarget.value) return

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && !loading.value && !props.disabled) {
        handleLoad()
      }
    },
    {
      rootMargin: `-${props.distance}px`
    }
  )

  observer.observe(observerTarget.value)
}

/**
 * 使用滚动事件（回退方案）
 */
const handleScroll = throttle(() => {
  if (loading.value || props.disabled) return

  const el = container === window ? document.documentElement : (container as HTMLElement)
  const scrollTop = el.scrollTop
  const scrollHeight = el.scrollHeight
  const clientHeight = el.clientHeight

  const distance = props.vertical
    ? scrollHeight - scrollTop - clientHeight
    : scrollWidth - scrollLeft - clientWidth

  if (distance <= props.distance) {
    handleLoad()
  }
}, 200)

/**
 * 绑定滚动事件
 */
const bindScrollEvent = () => {
  // 查找滚动容器
  let parent = observerTarget.value?.parentElement
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent)
    const overflow = style.overflow + style.overflowY + style.overflowX
    if (overflow.includes('auto') || overflow.includes('scroll')) {
      container = parent
      break
    }
    parent = parent.parentElement
  }

  if (!container) {
    container = window
  }

  container.addEventListener('scroll', handleScroll)
}

/**
 * 处理加载
 */
const handleLoad = () => {
  if (loading.value || props.disabled) return

  loading.value = true
  emit('load')
}

/**
 * 重置加载状态
 */
const resetLoading = () => {
  loading.value = false
}

/**
 * 清理
 */
const cleanup = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (container) {
    container.removeEventListener('scroll', handleScroll)
    container = null
  }
}

// 监听 disabled 变化
watch(
  () => props.disabled,
  (newVal) => {
    if (newVal) {
      cleanup()
    } else if (observerTarget.value) {
      initObserver()
      bindScrollEvent()
    }
  }
)

onMounted(() => {
  // 优先使用 IntersectionObserver
  if ('IntersectionObserver' in window) {
    initObserver()
  } else {
    bindScrollEvent()
  }
})

onUnmounted(() => {
  cleanup()
})

// 暴露方法
defineExpose({
  resetLoading,
  loading
})
</script>

<template>
  <div ref="observerTarget" class="infinite-scroll-target">
    <div v-if="loading" class="infinite-scroll-loading">
      <slot name="loading">
        <span>加载中...</span>
      </slot>
    </div>
    <div v-else-if="!disabled" class="infinite-scroll-spacer" :style="{ height: `${distance}px` }"></div>
  </div>
</template>

<style scoped lang="scss">
.infinite-scroll-target {
  width: 100%;
}

.infinite-scroll-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: var(--el-text-color-secondary);
}

.infinite-scroll-spacer {
  width: 100%;
}
</style>
