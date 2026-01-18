/**
 * 主题切换 composable
 */

import { useTheme } from '@/utils/theme'

export function useThemeSwitch() {
  const theme = useTheme()
  
  return {
    toggleDark: theme.toggleDark,
    setPrimaryColor: theme.setPrimaryColor,
    setSideMenuTheme: theme.setSideMenuTheme
  }
}
