<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <div class="avatar-container">
      <el-avatar :size="32" :src="avatar" />
      <span class="username">{{ username }}</span>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="profile">
          <el-icon><User /></el-icon>
          个人中心
        </el-dropdown-item>
        <el-dropdown-item command="settings">
          <el-icon><Setting /></el-icon>
          系统设置
        </el-dropdown-item>
        <el-dropdown-item divided command="logout">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { User, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { useMessage } from '@/hooks/web/useMessage'

const router = useRouter()
const userStore = useUserStore()
const { confirm, info } = useMessage()

const username = computed(() => userStore.getUser?.username || 'Admin')
const avatar = computed(() => userStore.getUser?.avatar || '')

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      info('个人中心功能开发中')
      break
    case 'settings':
      info('系统设置功能开发中')
      break
    case 'logout':
      try {
        await confirm('确定要退出登录吗?', '提示')
        await userStore.logoutAction()
        // 简化版：不再跳转到登录页，直接刷新页面
        window.location.reload()
      } catch (error) {
        // 用户取消退出登录
      }
      break
  }
}
</script>

<style scoped lang="scss">
.avatar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .username {
    font-size: 14px;
  }
}
</style>
