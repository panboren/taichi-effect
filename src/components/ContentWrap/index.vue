<template>
  <div class="content-wrap">
    <slot />
  </div>
</template>

<script setup lang="ts">
// 内容包裹组件
</script>

<style scoped lang="scss">
.content-wrap {
  padding: 20px;
  background: var(--el-bg-color);
  min-height: calc(100vh - 84px);
}
</style>
