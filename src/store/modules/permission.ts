/**
 * 权限状态管理
 * 简化版 - 不再使用动态路由
 */

import { defineStore } from 'pinia'
import { store } from '@/store'
import type { RouteRecordRaw } from 'vue-router'

interface PermissionState {
  routers: RouteRecordRaw[]
  addRouters: RouteRecordRaw[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    addRouters: []
  }),
  getters: {
    getRouters: (state) => state.routers,
    getAddRouters: (state) => state.addRouters
  },
  actions: {
    async generateRoutes() {
      return new Promise<void>((resolve) => {
        // 简化版：不生成动态路由
        this.addRouters = []
        this.routers = []
        resolve()
      })
    },
    resetState() {
      this.routers = []
      this.addRouters = []
    }
  }
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}
