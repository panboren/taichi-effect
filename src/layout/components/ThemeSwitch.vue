<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <span class="theme-switch">
      <el-switch
        v-model="isDark"
        inline-prompt
        :active-icon="Moon"
        :inactive-icon="Sunny"
        @change="toggleTheme"
      />
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="color in themeColors" :key="color.value" :command="color.value">
          <span class="color-dot" :style="{ backgroundColor: color.value }"></span>
          {{ color.label }}
        </el-dropdown-item>
        <el-dropdown-item divided v-for="menuTheme in menuThemes" :key="menuTheme.value" :command="menuTheme.value">
          <span class="color-dot" :style="{ backgroundColor: menuTheme.bgColor }"></span>
          {{ menuTheme.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/modules/app'
import { useTheme } from '@/utils/theme'

const appStore = useAppStore()
const theme = useTheme()

const isDark = computed({
  get: () => appStore.getIsDark,
  set: (value: boolean) => {
    appStore.setIsDark(value)
    if (value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
})

const toggleTheme = () => {
  // v-model 会自动处理切换
}

const themeColors = [
  { label: '默认蓝', value: '#409eff' },
  { label: '翡翠绿', value: '#00a870' },
  { label: '樱花粉', value: '#ff4d7f' },
  { label: '活力橙', value: '#ff7d00' },
  { label: '深紫色', value: '#722ed1' }
]

const menuThemes = [
  { label: '深色菜单', value: 'dark', bgColor: '#001529' },
  { label: '浅色菜单', value: 'light', bgColor: '#ffffff' }
]

const handleCommand = (command: string) => {
  if (command.startsWith('#')) {
    theme.setPrimaryColor(command)
  } else if (command === 'dark') {
    theme.setSideMenuTheme('#001529')
  } else if (command === 'light') {
    theme.setSideMenuTheme('#ffffff')
  }
}
</script>

<style scoped>
.theme-switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  border: 1px solid #dcdfe6;
}
</style>
