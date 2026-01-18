<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

const appStore = useAppStore()
const { locale } = useI18n()

// 根据 i18n locale 动态设置 Element Plus locale
const elementPlusLocale = computed(() => {
  const locales: Record<string, any> = {
    'zh-CN': zhCn,
    'en-US': en
  }
  return locales[locale.value] || zhCn
})
</script>

<template>
  <el-config-provider :locale="elementPlusLocale">
    <router-view />
  </el-config-provider>
</template>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
