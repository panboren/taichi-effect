<template>
  <div class="logo">
    <img v-if="showLogo" src="/logo.svg" alt="logo" class="logo-img" />
    <span v-if="showTitle" class="logo-title">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()

const title = computed(() => appStore.getTitle)
const showLogo = computed(() => appStore.getLogo)
const showTitle = computed(() => appStore.getLogo)
</script>

<style scoped lang="scss">
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #fff;

  .logo-img {
    width: 32px;
    height: 32px;
  }

  .logo-title {
    white-space: nowrap;
  }
}
</style>
