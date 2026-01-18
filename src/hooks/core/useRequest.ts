/**
 * 统一请求 Hook
 * 处理加载状态、错误、重试、取消
 */

import { ref, computed, onUnmounted, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { performanceMonitor } from '@/core/PerformanceMonitor'

export interface UseRequestOptions<T> {
  // 初始数据
  initialData?: T
  // 立即执行
  immediate?: boolean
  // 成功回调
  onSuccess?: (data: T) => void
  // 错误回调
  onError?: (error: Error) => void
  // 完成回调
  onFinally?: () => void
  // 重试次数
  retryCount?: number
  // 重试延迟（ms）
  retryDelay?: number
  // 是否显示错误消息
  showError?: boolean
  // 是否显示成功消息
  showSuccess?: boolean
  // 成功消息
  successMessage?: string
  // 是否防抖
  debounce?: boolean
  // 防抖延迟（ms）
  debounceWait?: number
}

export interface UseRequestReturn<T> {
  // 数据
  data: Ref<T | null>
  // 加载状态
  loading: Ref<boolean>
  // 错误
  error: Ref<Error | null>
  // 执行请求
  run: (...args: any[]) => Promise<T>
  // 取消请求
  cancel: () => void
  // 重新执行
  refresh: () => Promise<T>
  // 变更数据
  mutate: (data: T) => void
  // 重置
  reset: () => void
  // 是否成功
  isSuccess: Ref<boolean>
  // 是否失败
  isError: Ref<boolean>
}

/**
 * 请求状态管理
 */
export function useRequest<T = any>(
  service: (...args: any[]) => Promise<T>,
  options: UseRequestOptions<T> = {}
): UseRequestReturn<T> {
  const {
    initialData = null,
    immediate = false,
    onSuccess,
    onError,
    onFinally,
    retryCount = 0,
    retryDelay = 1000,
    showError = true,
    showSuccess = false,
    successMessage,
    debounce = false,
    debounceWait = 300
  } = options

  const { t } = useI18n()

  const data = ref<T | null>(initialData) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const isSuccess = ref(false)
  const isError = ref(false)

  let abortController: AbortController | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 执行请求
   */
  const run = async (...args: any[]): Promise<T> => {
    // 取消之前的请求
    cancel()

    // 防抖
    if (debounce) {
      return new Promise((resolve, reject) => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          executeRequest(args).then(resolve).catch(reject)
        }, debounceWait)
      })
    }

    return executeRequest(args)
  }

  /**
   * 执行请求（内部）
   */
  const executeRequest = async (args: any[], currentRetry = 0): Promise<T> => {
    loading.value = true
    error.value = null
    isSuccess.value = false
    isError.value = false

    abortController = new AbortController()

    const measureApi = performanceMonitor.measureApiRequest(service.name || 'unknown')

    try {
      // 添加 signal 到请求配置
      const result = await service(...args, {
        signal: abortController.signal
      })

      measureApi()

      data.value = result
      isSuccess.value = true

      if (showSuccess && successMessage) {
        ElMessage.success(successMessage)
      }

      onSuccess?.(result)
      return result
    } catch (err: any) {
      measureApi()

      // 如果是取消错误，不进行重试
      if (err.name === 'AbortError') {
        throw err
      }

      error.value = err
      isError.value = true

      if (showError && err.message) {
        ElMessage.error(err.message)
      }

      // 重试逻辑
      if (currentRetry < retryCount) {
        await new Promise((resolve) => {
          retryTimer = setTimeout(resolve, retryDelay)
        })
        return executeRequest(args, currentRetry + 1)
      }

      onError?.(err)
      throw err
    } finally {
      loading.value = false
      onFinally?.()
    }
  }

  /**
   * 取消请求
   */
  const cancel = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    loading.value = false
  }

  /**
   * 重新执行
   */
  const refresh = async (): Promise<T> => {
    return run()
  }

  /**
   * 变更数据
   */
  const mutate = (newData: T) => {
    data.value = newData
  }

  /**
   * 重置
   */
  const reset = () => {
    cancel()
    data.value = initialData
    error.value = null
    isSuccess.value = false
    isError.value = false
  }

  // 立即执行
  if (immediate) {
    run()
  }

  // 清理
  onUnmounted(() => {
    reset()
  })

  return {
    data,
    loading,
    error,
    run,
    cancel,
    refresh,
    mutate,
    reset,
    isSuccess,
    isError
  }
}

/**
 * 自动请求 Hook（会自动执行）
 */
export function useAutoRequest<T = any>(
  service: (...args: any[]) => Promise<T>,
  options: UseRequestOptions<T> = {}
): UseRequestReturn<T> {
  return useRequest(service, { ...options, immediate: true })
}

/**
 * 手动请求 Hook（需要手动调用 run）
 */
export function useManualRequest<T = any>(
  service: (...args: any[]) => Promise<T>,
  options: UseRequestOptions<T> = {}
): UseRequestReturn<T> {
  return useRequest(service, { ...options, immediate: false })
}
