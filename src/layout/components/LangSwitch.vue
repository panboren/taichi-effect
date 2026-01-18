<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <span class="lang-switch">
      <el-icon><Location /></el-icon>
      <span class="lang-label">{{ currentLangLabel }}</span>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="lang in languages" :key="lang.value" :command="lang.value">
          {{ lang.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Location } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/modules/app'
import { setI18nLanguage } from '@/i18n'
import { ElMessage } from 'element-plus'

const { locale } = useI18n()
const appStore = useAppStore()

const languages = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

const currentLangLabel = computed(() => {
  const lang = languages.find(item => item.value === locale.value)
  return lang ? lang.label : languages[0].label
})

const handleCommand = (command: string) => {
  if (command !== locale.value) {
    setI18nLanguage(command)
    appStore.setLocale(command)
    ElMessage.success(`${languages.find(l => l.value === command)?.label} 已切换`)
  }
}
</script>

<style scoped lang="scss">
.lang-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--top-header-hover-color);
  }

  .lang-label {
    font-size: 14px;
  }
}
</style>
