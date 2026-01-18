<template>
  <div class="app-header">
    <Logo v-if="appStore.getLogo" />
    <Breadcrumb v-if="appStore.getBreadcrumb" />
    <div class="right-menu">
      <LangSwitch />
      <ThemeSwitch />
      <Screenfull />
      <UserDropdown />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/modules/app'
import Logo from './Logo.vue'
import Breadcrumb from './Breadcrumb.vue'
import LangSwitch from './LangSwitch.vue'
import ThemeSwitch from './ThemeSwitch.vue'
import Screenfull from './Screenfull.vue'
import UserDropdown from './UserDropdown.vue'

const appStore = useAppStore()
</script>

<style scoped lang="scss">
.app-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--top-header-bg-color);
  color: var(--top-header-text-color);
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;

  .right-menu {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}
</style>
