/**
 * 主题工具函数
 */

import { useAppStore } from '@/store/modules/app'
import type { ThemeTypes } from '@/types/theme'

export const useTheme = () => {
  const appStore = useAppStore()

  /**
   * 切换暗黑模式
   */
  const toggleDark = () => {
    const isDark = !appStore.getIsDark
    appStore.setIsDark(isDark)

    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  /**
   * 初始化暗黑模式
   */
  const initDark = () => {
    const isDark = appStore.getIsDark
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }

  /**
   * 设置主题色
   */
  const setPrimaryColor = (color: string) => {
    document.documentElement.style.setProperty('--el-color-primary', color)

    const mixColor = (color1: string, color2: string, weight: number) => {
      const hex2rgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return [r, g, b]
      }

      const [r1, g1, b1] = hex2rgb(color1)
      const [r2, g2, b2] = hex2rgb(color2)

      const r = Math.round(r1 * weight + r2 * (1 - weight))
      const g = Math.round(g1 * weight + g2 * (1 - weight))
      const b = Math.round(b1 * weight + b2 * (1 - weight))

      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }

    for (let i = 1; i <= 9; i++) {
      const weight = 1 - i * 0.1
      const lightColor = mixColor(color, '#ffffff', weight)
      document.documentElement.style.setProperty(`--el-color-primary-light-${i}`, lightColor)
    }

    const darkColor = mixColor(color, '#000000', 0.9)
    document.documentElement.style.setProperty('--el-color-primary-dark-2', darkColor)

    const root = document.documentElement

    for (let i = 1; i <= 9; i++) {
      const lightValue = root.style.getPropertyValue(`--el-color-primary-light-${i}`)
      if (lightValue) {
        root.style.setProperty(`--el-color-primary-light-${i}`, lightValue)
      }
    }

    appStore.setTheme({ ...appStore.getTheme, elColorPrimary: color })
  }

  /**
   * 设置侧边栏主题
   */
  const setSideMenuTheme = (bgColor: string, activeColor?: string) => {
    const theme: ThemeTypes = { ...appStore.getTheme }
    theme.leftMenuBgColor = bgColor

    if (activeColor) {
      theme.leftMenuBgActiveColor = activeColor
    }

    if (bgColor === '#001529' || bgColor === '#263445') {
      theme.leftMenuTextColor = '#bfcbd9'
      theme.leftMenuTextActiveColor = '#fff'
      theme.logoTitleTextColor = '#fff'
    } else {
      theme.leftMenuTextColor = '#606266'
      theme.leftMenuTextActiveColor = '#409eff'
      theme.logoTitleTextColor = '#333'
    }

    appStore.setTheme(theme)
    applyThemeVars(theme)
  }

  /**
   * 应用主题变量到 DOM
   */
  const applyThemeVars = (theme: ThemeTypes) => {
    document.documentElement.style.setProperty('--el-color-primary', theme.elColorPrimary)
    document.documentElement.style.setProperty('--left-menu-border-color', theme.leftMenuBorderColor)
    document.documentElement.style.setProperty('--left-menu-bg-color', theme.leftMenuBgColor)
    document.documentElement.style.setProperty('--left-menu-bg-active-color', theme.leftMenuBgActiveColor)
    document.documentElement.style.setProperty('--left-menu-text-color', theme.leftMenuTextColor)
    document.documentElement.style.setProperty('--left-menu-text-active-color', theme.leftMenuTextActiveColor)
    document.documentElement.style.setProperty('--logo-title-text-color', theme.logoTitleTextColor)
    document.documentElement.style.setProperty('--top-header-bg-color', theme.topHeaderBgColor)
    document.documentElement.style.setProperty('--top-header-text-color', theme.topHeaderTextColor)
    document.documentElement.style.setProperty('--top-header-hover-color', theme.topHeaderHoverColor)
  }

  /**
   * 初始化主题
   */
  const initTheme = () => {
    const theme = appStore.getTheme
    setPrimaryColor(theme.elColorPrimary)
    applyThemeVars(theme)
    initDark()
  }

  return {
    toggleDark,
    initDark,
    setPrimaryColor,
    setSideMenuTheme,
    applyThemeVars,
    initTheme
  }
}

