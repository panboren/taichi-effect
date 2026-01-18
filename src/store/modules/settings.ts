/**
 * 设置状态管理
 * 管理系统设置（布局、主题、侧边栏等）
 */

import { defineStore } from 'pinia'
import { store } from '@/store'
import { setStorage, getStorage } from '@/utils/storage'
import type { LayoutMode } from '@/types'

interface SettingsState {
  // 布局模式
  layoutMode: LayoutMode
  // 侧边栏折叠
  sidebarCollapsed: boolean
  // 显示标签页
  showTagsView: boolean
  // 显示面包屑
  showBreadcrumb: true
  // 显示页脚
  showFooter: boolean
  // 固定头部
  fixedHeader: boolean
  // 固定侧边栏
  fixedSidebar: boolean
  // 内容宽度
  contentWidth: 'fluid' | 'fixed'
  // 语言
  lang: string
  // 主题色
  primaryColor: string
  // 是否暗黑模式
  isDark: boolean
}

const SETTINGS_KEY = 'app-settings'

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => {
    // 从 localStorage 读取设置
    const saved = getStorage(SETTINGS_KEY)
    return {
      layoutMode: saved?.layoutMode || 'classic',
      sidebarCollapsed: saved?.sidebarCollapsed || false,
      showTagsView: saved?.showTagsView ?? true,
      showBreadcrumb: saved?.showBreadcrumb ?? true,
      showFooter: saved?.showFooter ?? false,
      fixedHeader: saved?.fixedHeader ?? true,
      fixedSidebar: saved?.fixedSidebar ?? true,
      contentWidth: saved?.contentWidth || 'fluid',
      lang: saved?.lang || 'zh-CN',
      primaryColor: saved?.primaryColor || '#409eff',
      isDark: saved?.isDark || false
    }
  },

  getters: {
    getLayoutMode: (state) => state.layoutMode,
    getSidebarCollapsed: (state) => state.sidebarCollapsed,
    getShowTagsView: (state) => state.showTagsView,
    getShowBreadcrumb: (state) => state.showBreadcrumb,
    getShowFooter: (state) => state.showFooter,
    getFixedHeader: (state) => state.fixedHeader,
    getFixedSidebar: (state) => state.fixedSidebar,
    getContentWidth: (state) => state.contentWidth,
    getLang: (state) => state.lang,
    getPrimaryColor: (state) => state.primaryColor,
    getIsDark: (state) => state.isDark
  },

  actions: {
    /**
     * 设置布局模式
     */
    setLayoutMode(mode: LayoutMode) {
      this.layoutMode = mode
      this.saveSettings()
    },

    /**
     * 切换侧边栏折叠
     */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      this.saveSettings()
    },

    /**
     * 设置侧边栏折叠状态
     */
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
      this.saveSettings()
    },

    /**
     * 设置标签页显示
     */
    setShowTagsView(show: boolean) {
      this.showTagsView = show
      this.saveSettings()
    },

    /**
     * 设置面包屑显示
     */
    setShowBreadcrumb(show: boolean) {
      this.showBreadcrumb = show
      this.saveSettings()
    },

    /**
     * 设置页脚显示
     */
    setShowFooter(show: boolean) {
      this.showFooter = show
      this.saveSettings()
    },

    /**
     * 设置固定头部
     */
    setFixedHeader(fixed: boolean) {
      this.fixedHeader = fixed
      this.saveSettings()
    },

    /**
     * 设置固定侧边栏
     */
    setFixedSidebar(fixed: boolean) {
      this.fixedSidebar = fixed
      this.saveSettings()
    },

    /**
     * 设置内容宽度
     */
    setContentWidth(width: 'fluid' | 'fixed') {
      this.contentWidth = width
      this.saveSettings()
    },

    /**
     * 设置语言
     */
    setLang(lang: string) {
      this.lang = lang
      this.saveSettings()
    },

    /**
     * 设置主题色
     */
    setPrimaryColor(color: string) {
      this.primaryColor = color
      this.saveSettings()

      // 更新 CSS 变量
      document.documentElement.style.setProperty('--el-color-primary', color)
    },

    /**
     * 设置暗黑模式
     */
    setIsDark(dark: boolean) {
      this.isDark = dark
      this.saveSettings()

      // 切换暗黑模式
      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },

    /**
     * 保存设置到本地存储
     */
    saveSettings() {
      setStorage(SETTINGS_KEY, {
        layoutMode: this.layoutMode,
        sidebarCollapsed: this.sidebarCollapsed,
        showTagsView: this.showTagsView,
        showBreadcrumb: this.showBreadcrumb,
        showFooter: this.showFooter,
        fixedHeader: this.fixedHeader,
        fixedSidebar: this.fixedSidebar,
        contentWidth: this.contentWidth,
        lang: this.lang,
        primaryColor: this.primaryColor,
        isDark: this.isDark
      })
    },

    /**
     * 重置为默认设置
     */
    resetSettings() {
      this.layoutMode = 'classic'
      this.sidebarCollapsed = false
      this.showTagsView = true
      this.showBreadcrumb = true
      this.showFooter = false
      this.fixedHeader = true
      this.fixedSidebar = true
      this.contentWidth = 'fluid'
      this.lang = 'zh-CN'
      this.primaryColor = '#409eff'
      this.isDark = false
      this.saveSettings()
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: SETTINGS_KEY,
        storage: localStorage
      }
    ]
  }
})

export const useSettingsStoreWithOut = () => {
  return useSettingsStore(store)
}
