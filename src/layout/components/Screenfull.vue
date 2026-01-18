<template>
  <el-icon @click="toggle">
    <FullScreen v-if="!isFullscreen" />
    <Aim v-else />
  </el-icon>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { FullScreen, Aim } from '@element-plus/icons-vue'

const isFullscreen = ref(false)

const toggle = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>
