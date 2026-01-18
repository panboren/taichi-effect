<template>
  <div class="optimized-image" :class="{ loaded }">
    <!-- 占位图 -->
    <img
      v-if="loading && placeholder"
      :src="placeholder"
      :alt="alt"
      class="placeholder"
    />

    <!-- 主图片 -->
    <img
      :src="currentSrc"
      :alt="alt"
      :loading="lazy ? 'lazy' : 'eager'"
      :width="width"
      :height="height"
      :class="{ 'fade-in': !loaded }"
      @load="handleLoad"
      @error="handleError"
      @loadstart="handleLoadStart"
    />

    <!-- 错误占位图 -->
    <img v-if="error && errorImage" :src="errorImage" :alt="alt" class="error-image" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getOptimalImageFormat } from '@/utils/imageOptimizer'

interface Props {
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  lazy?: boolean
  placeholder?: string
  errorImage?: string
  useWebP?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  lazy: true,
  useWebP: true
})

const loading = ref(true)
const error = ref(false)
const loaded = ref(false)

const currentSrc = computed(() => {
  if (props.useWebP && getOptimalImageFormat() === 'webp') {
    // 如果浏览器支持 WebP，尝试加载 WebP 版本
    const webpSrc = props.src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    return webpSrc
  }
  return props.src
})

const handleLoad = () => {
  loading.value = false
  loaded.value = true
  error.value = false
}

const handleError = () => {
  loading.value = false
  error.value = true
}

const handleLoadStart = () => {
  loading.value = true
  error.value = false
}
</script>

<style scoped lang="scss">
.optimized-image {
  position: relative;
  display: inline-block;
  overflow: hidden;

  img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
    transition: opacity 0.3s ease;

    &.fade-in {
      opacity: 0;
    }

    &.loaded {
      opacity: 1;
    }
  }

  .placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .error-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0.5;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
