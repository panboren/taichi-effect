<!--
  错误边界组件
  捕获子组件错误并显示友好提示
-->

<script setup lang="ts">
import { ref, onErrorCaptured, provide, type VNode } from 'vue'
import type { ErrorCapturedPayload } from '@/types'

interface Props {
  // 是否显示错误详情（开发环境）
  showDetails?: boolean
  // 自定义错误回退组件
  fallback?: VNode
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: import.meta.env.DEV
})

const emit = defineEmits<{
  error: [err: Error, vm: any, info: string]
  reset: []
}>()

const error = ref<Error | null>(null)
const errorInfo = ref('')
const errorVm = ref<any>(null)

// 捕获子组件错误
onErrorCaptured((err: Error, vm: any, info: string) => {
  error.value = err
  errorInfo.value = info
  errorVm.value = vm

  emit('error', err, vm, info)

  // 阻止错误继续向上传播
  return false
})

/**
 * 重置错误状态
 */
const reset = () => {
  error.value = null
  errorInfo.value = ''
  errorVm.value = null
  emit('reset')
}

// 提供重置方法给子组件
provide('resetErrorBoundary', reset)

// 暴露方法
defineExpose({
  reset
})
</script>

<template>
  <slot v-if="!error"></slot>
  <div v-else class="error-boundary">
    <!-- 自定义回退组件 -->
    <component :is="fallback" v-if="fallback"></component>

    <!-- 默认错误提示 -->
    <div v-else class="error-boundary-content">
      <el-icon :size="64" color="#f56c6c">
        <CircleCloseFilled />
      </el-icon>
      <h3 class="error-boundary-title">抱歉，页面出错了</h3>
      <p class="error-boundary-desc">页面发生了一些错误，您可以尝试刷新页面或联系管理员</p>

      <div class="error-boundary-actions">
        <el-button type="primary" @click="reset">
          <el-icon><RefreshRight /></el-icon>
          重试
        </el-button>
        <el-button @click="$router?.go(0)">
          <el-icon><Refresh /></el-icon>
          刷新页面
        </el-button>
      </div>

      <!-- 错误详情（开发环境） -->
      <el-collapse v-if="showDetails" class="error-boundary-details">
        <el-collapse-item title="错误详情" name="details">
          <div class="error-boundary-detail-item">
            <span class="label">错误信息:</span>
            <span class="value">{{ error?.message }}</span>
          </div>
          <div class="error-boundary-detail-item">
            <span class="label">错误堆栈:</span>
            <pre class="value">{{ error?.stack }}</pre>
          </div>
          <div v-if="errorInfo" class="error-boundary-detail-item">
            <span class="label">组件位置:</span>
            <span class="value">{{ errorInfo }}</span>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 24px;
  background: var(--el-fill-color-blank);
  border-radius: 8px;
}

.error-boundary-content {
  text-align: center;
  max-width: 500px;

  &-title {
    margin: 16px 0 8px;
    font-size: 20px;
    color: var(--el-text-color-primary);
  }

  &-desc {
    margin-bottom: 24px;
    color: var(--el-text-color-regular);
    line-height: 1.6;
  }

  &-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 24px;
  }

  &-details {
    margin-top: 24px;
    text-align: left;
  }

  &-detail-item {
    margin-bottom: 12px;

    .label {
      display: inline-block;
      font-weight: bold;
      color: var(--el-text-color-regular);
      margin-bottom: 4px;
    }

    .value {
      display: block;
      padding: 8px 12px;
      background: var(--el-fill-color-light);
      border-radius: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      word-break: break-all;
      white-space: pre-wrap;
    }
  }
}
</style>
