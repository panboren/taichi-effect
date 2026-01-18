<template>
  <div v-if="!item.meta?.hidden">
    <!-- 只有一个子菜单的情况 -->
    <template v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren)">
      <el-menu-item
        v-if="onlyOneChild.meta"
        :index="resolvePath(onlyOneChild.path)"
      >
        <el-icon v-if="onlyOneChild.meta.icon">
          <component :is="onlyOneChild.meta.icon" />
        </el-icon>
        <template #title>
          <span>{{ onlyOneChild.meta.title }}</span>
        </template>
      </el-menu-item>
    </template>

    <!-- 多个子菜单的情况，使用子菜单 -->
    <el-sub-menu v-else :index="resolvePath(item.path)">
      <template #title>
        <el-icon v-if="item.meta.icon">
          <component :is="item.meta.icon" />
        </el-icon>
        <span>{{ item.meta.title }}</span>
      </template>
      <SidebarItem
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </el-sub-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { isExternal } from '@/utils/validate'
import type { RouteRecordRaw } from 'vue-router'

interface Props {
  item: RouteRecordRaw
  basePath?: string
}

const props = withDefaults(defineProps<Props>(), {
  basePath: ''
})

const onlyOneChild = ref<any>(null)

const hasOneShowingChild = (children: RouteRecordRaw[] = [], parent: RouteRecordRaw) => {
  const showingChildren = children.filter((item) => {
    if (item.meta?.hidden) {
      return false
    }
    onlyOneChild.value = item
    return true
  })

  if (showingChildren.length === 1) {
    return true
  }

  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
    return true
  }

  return false
}

const resolvePath = (routePath: string) => {
  if (isExternal(routePath)) {
    return routePath
  }
  if (isExternal(props.basePath)) {
    return props.basePath
  }

  // 如果路径已经是绝对路径（以 / 开头），直接返回
  if (routePath.startsWith('/')) {
    return routePath
  }

  // 如果有 basePath，拼接路径
  if (props.basePath) {
    return `${props.basePath}/${routePath}`
  }
  return routePath
}
</script>
