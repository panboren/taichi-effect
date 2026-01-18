/**
 * 虚拟列表 Hook
 * 用于渲染大量数据时优化性能
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

export interface VirtualListOptions<T> {
  // 数据源
  dataSource: Ref<T[]>
  // 每项高度（固定高度）
  itemHeight?: number
  // 容器高度
  containerHeight?: number
  // 缓冲区数量（上下各额外渲染几项）
  bufferSize?: number
  // 获取动态高度的函数
  getItemHeight?: (item: T, index: number) => number
}

export interface VirtualListReturn<T> {
  // 可见数据
  visibleData: Ref<T[]>
  // 起始索引
  startIndex: Ref<number>
  // 结束索引
  endIndex: Ref<number>
  // 滚动容器高度
  containerHeight: Ref<number>
  // 总高度
  totalHeight: Ref<number>
  // 偏移量
  offsetY: Ref<number>
  // 滚动处理
  onScroll: (e: Event) => void
  // 滚动到指定项
  scrollToIndex: (index: number) => void
  // 滚动到指定位置
  scrollTo: (scrollTop: number) => void
}

/**
 * 固定高度虚拟列表
 */
export function useVirtualList<T = any>(
  options: VirtualListOptions<T>
): VirtualListReturn<T> {
  const {
    dataSource,
    itemHeight = 50,
    containerHeight: _containerHeight = 500,
    bufferSize = 5
  } = options

  const startIndex = ref(0)
  const endIndex = ref(0)
  const offsetY = ref(0)
  const containerHeight = ref(_containerHeight)
  const containerRef = ref<HTMLElement | null>(null)

  // 可见数量
  const visibleCount = computed(() => Math.ceil(containerHeight.value / itemHeight) + 1)

  // 缓冲后的起始和结束索引
  const bufferStartIndex = computed(() => Math.max(0, startIndex.value - bufferSize))
  const bufferEndIndex = computed(() =>
    Math.min(dataSource.value.length, endIndex.value + bufferSize)
  )

  // 可见数据
  const visibleData = computed(() =>
    dataSource.value.slice(bufferStartIndex.value, bufferEndIndex.value)
  )

  // 总高度
  const totalHeight = computed(() => dataSource.value.length * itemHeight)

  /**
   * 滚动处理
   */
  const onScroll = (e: Event) => {
    const target = e.target as HTMLElement
    const scrollTop = target.scrollTop

    offsetY.value = scrollTop
    startIndex.value = Math.floor(scrollTop / itemHeight)
    endIndex.value = startIndex.value + visibleCount.value
  }

  /**
   * 滚动到指定项
   */
  const scrollToIndex = (index: number) => {
    const targetScrollTop = index * itemHeight
    containerRef.value?.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
  }

  /**
   * 滚动到指定位置
   */
  const scrollTo = (scrollTop: number) => {
    containerRef.value?.scrollTo({ top: scrollTop, behavior: 'smooth' })
  }

  // 初始化
  onMounted(() => {
    endIndex.value = visibleCount.value
  })

  return {
    visibleData,
    startIndex,
    endIndex,
    containerHeight,
    totalHeight,
    offsetY,
    onScroll,
    scrollToIndex,
    scrollTo
  }
}

/**
 * 动态高度虚拟列表
 */
export function useDynamicVirtualList<T = any>(
  options: VirtualListOptions<T>
): VirtualListReturn<T> {
  const { dataSource, getItemHeight } = options

  const startIndex = ref(0)
  const endIndex = ref(0)
  const offsetY = ref(0)
  const containerHeight = ref(500)
  const positions = ref<{ top: number; height: number; bottom: number }[]>([])

  // 初始化位置信息
  const initPositions = () => {
    positions.value = dataSource.value.map((_, index) => ({
      top: index * 50, // 默认高度
      height: 50,
      bottom: (index + 1) * 50
    }))
  }

  // 计算实际高度
  const calculatePositions = () => {
    if (!getItemHeight) return

    let top = 0
    positions.value = dataSource.value.map((item, index) => {
      const height = getItemHeight(item, index)
      const position = { top, height, bottom: top + height }
      top += height
      return position
    })
  }

  // 总高度
  const totalHeight = computed(() => {
    const lastPosition = positions.value[positions.value.length - 1]
    return lastPosition ? lastPosition.bottom : 0
  })

  // 二分查找起始索引
  const findStartIndex = (scrollTop: number) => {
    let low = 0
    let high = positions.value.length - 1

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (positions.value[mid].bottom <= scrollTop) {
        low = mid + 1
      } else if (positions.value[mid].top > scrollTop) {
        high = mid - 1
      } else {
        return mid
      }
    }

    return 0
  }

  /**
   * 滚动处理
   */
  const onScroll = (e: Event) => {
    const target = e.target as HTMLElement
    const scrollTop = target.scrollTop

    offsetY.value = scrollTop
    startIndex.value = findStartIndex(scrollTop)
  }

  /**
   * 滚动到指定项
   */
  const scrollToIndex = (index: number) => {
    const position = positions.value[index]
    if (position) {
      offsetY.value = position.top
    }
  }

  /**
   * 滚动到指定位置
   */
  const scrollTo = (scrollTop: number) => {
    offsetY.value = scrollTop
  }

  // 可见数据（需要根据实际高度计算）
  const visibleData = computed(() => {
    const start = startIndex.value
    const scrollTop = offsetY.value
    const end = positions.value.findIndex((pos) => pos.bottom > scrollTop + containerHeight.value)
    return dataSource.value.slice(start, end === -1 ? undefined : end + 10)
  })

  // 初始化
  onMounted(() => {
    initPositions()
    calculatePositions()
  })

  return {
    visibleData,
    startIndex,
    endIndex,
    containerHeight,
    totalHeight,
    offsetY,
    onScroll,
    scrollToIndex,
    scrollTo
  }
}

export { useVirtualList as default }
