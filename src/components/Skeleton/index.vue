<!--
  骨架屏组件
  用于数据加载时的占位显示
-->

<script setup lang="ts">
interface Props {
  // 是否显示
  active?: boolean
  // 行数
  rows?: number
  // 标题行数
  titleRows?: number
  // 是否显示头像
  avatar?: boolean
  // 是否显示段落
  paragraph?: boolean
  // 是否显示标题
  title?: boolean
  // 是否显示加载动画
  animated?: boolean
  // 自定义类名
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  active: true,
  rows: 3,
  titleRows: 1,
  avatar: false,
  paragraph: true,
  title: true,
  animated: true,
  customClass: ''
})
</script>

<template>
  <div v-if="active" :class="['skeleton', { 'skeleton-animated': animated }, customClass]">
    <!-- 头像 -->
    <div v-if="avatar" class="skeleton-avatar"></div>

    <div class="skeleton-content">
      <!-- 标题 -->
      <div v-if="title" class="skeleton-title-wrapper">
        <div
          v-for="i in titleRows"
          :key="`title-${i}`"
          class="skeleton-title"
          :style="{ width: i === titleRows ? '60%' : '100%' }"
        ></div>
      </div>

      <!-- 段落 -->
      <div v-if="paragraph" class="skeleton-paragraph-wrapper">
        <div
          v-for="i in rows"
          :key="`row-${i}`"
          class="skeleton-paragraph"
          :style="{ width: i === rows ? '80%' : '100%' }"
        ></div>
      </div>

      <!-- 自定义内容 -->
      <div v-if="$slots.default" class="skeleton-custom">
        <slot></slot>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<style scoped lang="scss">
.skeleton {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--el-fill-color-blank);
  border-radius: 4px;

  &-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(90deg, var(--el-fill-color-light) 25%, var(--el-fill-color) 37%, var(--el-fill-color-light) 63%);
    background-size: 400% 100%;
  }

  &-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &-title {
    height: 16px;
    background: linear-gradient(90deg, var(--el-fill-color-light) 25%, var(--el-fill-color) 37%, var(--el-fill-color-light) 63%);
    background-size: 400% 100%;
    border-radius: 2px;
  }

  &-paragraph {
    height: 12px;
    background: linear-gradient(90deg, var(--el-fill-color-light) 25%, var(--el-fill-color) 37%, var(--el-fill-color-light) 63%);
    background-size: 400% 100%;
    border-radius: 2px;
  }

  &-animated .skeleton-avatar,
  &-animated .skeleton-title,
  &-animated .skeleton-paragraph {
    animation: skeleton-loading 1.4s ease infinite;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0 50%;
    }
  }
}
</style>
