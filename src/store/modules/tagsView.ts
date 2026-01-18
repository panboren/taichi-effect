/**
 * 标签页状态
 */

import { defineStore } from 'pinia'
import { store } from '@/store'
import type { RouteLocationNormalized } from 'vue-router'
import type { AppRouteRecordRaw } from '@/types'

interface TagsViewState {
  visitedViews: AppRouteRecordRaw[]
  cachedViews: Set<string>
  dragStartIndex: number | null
}

export const useTagsViewStore = defineStore('tagsView', {
  state: (): TagsViewState => ({
    visitedViews: [],
    cachedViews: new Set(),
    dragStartIndex: null
  }),
  getters: {
    getVisitedViews: (state) => state.visitedViews,
    getCachedViews: (state) => Array.from(state.cachedViews)
  },
  actions: {
    addView(view: RouteLocationNormalized) {
      this.addVisitedView(view)
      this.addCachedView(view)
    },
    addVisitedView(view: RouteLocationNormalized) {
      if (!this.visitedViews.some((v) => v.path === view.path)) {
        this.visitedViews.push(
          Object.assign({}, view, {
            title: view.meta?.title || 'unknown',
            affix: view.meta?.affix || false
          })
        )
      }
    },
    addCachedView(view: RouteLocationNormalized) {
      if (view.meta?.keepAlive && view.name) {
        this.cachedViews.add(view.name as string)
      }
    },
    delView(view: AppRouteRecordRaw) {
      this.delVisitedView(view)
      this.delCachedView(view)
    },
    delVisitedView(view: AppRouteRecordRaw) {
      const index = this.visitedViews.findIndex((v) => v.path === view.path)
      if (index > -1) {
        this.visitedViews.splice(index, 1)
      }
    },
    delCachedView(view: AppRouteRecordRaw) {
      if (view.name) {
        this.cachedViews.delete(view.name as string)
      }
    },
    delOthersViews(view: AppRouteRecordRaw) {
      this.visitedViews = this.visitedViews.filter((v) => v.path === view.path || v.meta?.affix)
      if (view.meta?.keepAlive && view.name) {
        const cacheNames = new Set([view.name as string])
        this.visitedViews.forEach((v) => {
          if (v.meta?.affix && v.name) {
            cacheNames.add(v.name as string)
          }
        })
        this.cachedViews = cacheNames
      }
    },
    delAllViews() {
      this.visitedViews = this.visitedViews.filter((v) => v.meta?.affix)
      const cacheNames = new Set()
      this.visitedViews.forEach((v) => {
        if (v.meta?.affix && v.name) {
          cacheNames.add(v.name as string)
        }
      })
      this.cachedViews = cacheNames
    },
    updateVisitedView(view: AppRouteRecordRaw) {
      const foundView = this.visitedViews.find((v) => v.path === view.path)
      if (foundView) {
        Object.assign(foundView, view)
      }
    },
    startDrag(index: number) {
      this.dragStartIndex = index
    },
    onDragOver(index: number) {
      if (this.dragStartIndex !== null && this.dragStartIndex !== index) {
        const draggedView = this.visitedViews[this.dragStartIndex]
        this.visitedViews.splice(this.dragStartIndex, 1)
        this.visitedViews.splice(index, 0, draggedView)
        this.dragStartIndex = index
      }
    },
    endDrag() {
      this.dragStartIndex = null
    }
  }
})

export const useTagsViewStoreWithOut = () => {
  return useTagsViewStore(store)
}
