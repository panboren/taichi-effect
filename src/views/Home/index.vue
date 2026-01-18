<template>
  <div class="home">
    <el-card>
      <template #header>
        <span>{{ t('home.welcome') }}</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic :title="t('home.totalUsers')" :value="1234" />
        </el-col>
        <el-col :span="6">
          <el-statistic :title="t('home.articleCount')" :value="567" />
        </el-col>
        <el-col :span="6">
          <el-statistic :title="t('home.totalViews')" :value="8901" />
        </el-col>
        <el-col :span="6">
          <el-statistic :title="t('home.todayViews')" :value="234" />
        </el-col>
      </el-row>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>{{ t('home.recentActivity') }}</span>
      </template>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="date" :label="t('home.date')" width="180" />
        <el-table-column prop="name" :label="t('home.user')" width="180" />
        <el-table-column prop="action" :label="t('home.action')" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const tableData = ref([
  {
    date: '2024-01-15',
    name: '张三',
    action: '登录系统'
  },
  {
    date: '2024-01-15',
    name: '李四',
    action: '创建文章'
  },
  {
    date: '2024-01-15',
    name: '王五',
    action: '更新用户信息'
  }
])
</script>

<style scoped lang="scss">
.home {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  box-sizing: border-box;
}
</style>

