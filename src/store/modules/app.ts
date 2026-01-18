/**
 * 应用状态
 */

import { defineStore } from 'pinia'
import { store } from '@/store'
import type { ThemeTypes } from '@/types/theme'

export type LayoutType = 'classic' | 'topLeft' | 'top' | 'cutMenu'

interface AppState {
  layout: LayoutType
  isDark: boolean
  currentSize: 'large' | 'default' | 'small'
  theme: ThemeTypes
  breadcrumb: boolean
  tagsView: boolean
  logo: boolean
  fixedHeader: boolean
  footer: boolean
  pageLoading: boolean
  mobile: boolean
  title: string
  locale: string
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    layout: 'classic',
    isDark: false,
    currentSize: 'default',
    theme: {
      elColorPrimary: '#409eff',
      leftMenuBorderColor: 'inherit',
      leftMenuBgColor: '#001529',
      leftMenuBgActiveColor: '#409eff',
      leftMenuTextColor: '#bfcbd9',
      leftMenuTextActiveColor: '#fff',
      logoTitleTextColor: '#fff',
      topHeaderBgColor: '#fff',
      topHeaderTextColor: 'inherit',
      topHeaderHoverColor: '#f6f6f6'
    },
    breadcrumb: true,
    tagsView: true,
    logo: true,
    fixedHeader: false,
    footer: true,
    pageLoading: false,
    mobile: false,
    title: import.meta.env.VITE_APP_TITLE,
    locale: 'zh-CN'
  }),
  getters: {
    getLayout: (state) => state.layout,
    getIsDark: (state) => state.isDark,
    getCurrentSize: (state) => state.currentSize,
    getTheme: (state) => state.theme,
    getBreadcrumb: (state) => state.breadcrumb,
    getTagsView: (state) => state.tagsView,
    getLogo: (state) => state.logo,
    getFixedHeader: (state) => state.fixedHeader,
    getPageLoading: (state) => state.pageLoading,
    getTitle: (state) => state.title,
    getLocale: (state) => state.locale
  },
  actions: {
    setLayout(layout: LayoutType) {
      this.layout = layout
    },
    setIsDark(isDark: boolean) {
      this.isDark = isDark
    },
    setCurrentSize(size: 'large' | 'default' | 'small') {
      this.currentSize = size
    },
    setTheme(theme: ThemeTypes) {
      this.theme = theme
    },
    setBreadcrumb(breadcrumb: boolean) {
      this.breadcrumb = breadcrumb
    },
    setTagsView(tagsView: boolean) {
      this.tagsView = tagsView
    },
    setLogo(logo: boolean) {
      this.logo = logo
    },
    setFixedHeader(fixedHeader: boolean) {
      this.fixedHeader = fixedHeader
    },
    setPageLoading(pageLoading: boolean) {
      this.pageLoading = pageLoading
    },
    setTitle(title: string) {
      this.title = title
    },
    setLocale(locale: string) {
      this.locale = locale
    }
  },
  persist: {
    key: 'app-store',
    storage: localStorage
  }
})

export const useAppStoreWithOut = () => {
  return useAppStore(store)
}
