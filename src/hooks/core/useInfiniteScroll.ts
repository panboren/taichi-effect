/**
 * 无限滚动 Hook
 * 自动加载更多数据
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'
import { throttle } from 'lodash-es'

export interface InfiniteScrollOptions<T> {
  // 加载函数
  onLoadMore: (page: number) => Promise<T[]>
  // 初始数据
  initialData?: T[]
  // 每页数量
  pageSize?: number
  // 距离底部多少像素触发加载
  distance?: number
  // 是否立即加载
  immediate?: boolean
  // 是否有更多数据
  hasMore?: (data: T[]) => boolean
  // 加载完成回调
  onComplete?: (data: T[]) => void
}

export interface InfiniteScrollReturn<T> {
  // 数据列表
  data: Ref<T[]>
  // 加载状态
  loading: Ref<boolean>
  // 是否有更多数据
  hasMoreData: Ref<boolean>
  // 当前页码
  currentPage: Ref<number>
  // 是否正在加载中
  isLoading: Ref<boolean>
  // 加载更多
  loadMore: () => Promise<void>
  // 重置
  reset: () => void
  // 滚动容器引用
  containerRef: Ref<HTMLElement | null>
}

/**
 * 无限滚动
 */
export function useInfiniteScroll<T = any>(
  options: InfiniteScrollOptions<T>
): InfiniteScrollReturn<T> {
  const {
    onLoadMore,
    initialData = [],
    pageSize = 20,
    distance = 100,
    immediate = true,
    hasMore,
    onComplete
  } = options

  const data = ref<T[]>([...initialData]) as Ref<T[]>
  const loading = ref(false)
  const hasMoreData = ref(true)
  const currentPage = ref(1)
  const isLoading = ref(false)
  const containerRef = ref<HTMLElement | null>(null)

  /**
   * 加载更多
   */
  const loadMore = async () => {
    if (loading.value || !hasMoreData.value) return

    loading.value = true
    isLoading.value = true

    try {
      const newData = await onLoadMore(currentPage.value)

      if (Array.isArray(newData) && newData.length > 0) {
        data.value.push(...newData)
        currentPage.value++

        // 检查是否还有更多数据
        if (hasMore) {
          hasMoreData.value = hasMore(data.value)
        } else {
          hasMoreData.value = newData.length >= pageSize
        }

        onComplete?.(data.value)
      } else {
        hasMoreData.value = false
      }
    } catch (error) {
      console.error('加载更多失败:', error)
    } finally {
      loading.value = false
      isLoading.value = false
    }
  }

  /**
   * 处理滚动事件
   */
  const handleScroll = throttle(() => {
    const container = containerRef.value
    if (!container || loading.value || !hasMoreData.value) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const remaining = scrollHeight - scrollTop - clientHeight

    if (remaining <= distance) {
      loadMore()
    }
  }, 200)

  /**
   * 重置
   */
  const reset = () => {
    data.value = [...initialData]
    loading.value = false
    hasMoreData.value = true
    currentPage.value = 1
    isLoading.value = false
  }

  /**
   * 绑定滚动事件
   */
  const bindScrollEvent = () => {
    const container = containerRef.value
    if (container) {
      container.addEventListener('scroll', handleScroll)
    }
  }

  /**
   * 解绑滚动事件
   */
  const unbindScrollEvent = () => {
    const container = containerRef.value
    if (container) {
      container.removeEventListener('scroll', handleScroll)
    }
  }

  onMounted(() => {
    bindScrollEvent()
    if (immediate) {
      loadMore()
    }
  })

  onUnmounted(() => {
    unbindScrollEvent()
  })

  return {
    data,
    loading,
    hasMoreData,
    currentPage,
    isLoading,
    loadMore,
    reset,
    containerRef
  }
}

export default useInfiniteScroll
