<template>
  <div class="app-wrapper">
    <Sidebar v-if="isSidebar" />
    <div class="main-container">
      <Header />
      <AppMain />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import AppMain from './components/AppMain.vue'

const appStore = useAppStore()

const isSidebar = computed(() => appStore.getLayout !== 'top')
</script>

<style scoped lang="scss">
.app-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  background-color: var(--page-bg-color);
  transition: background-color 0.3s ease;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--page-bg-color);
  transition: background-color 0.3s ease;
}

.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s ease;
}

.fade-transform-enter {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>


