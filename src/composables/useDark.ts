/**
 * 暗黑模式 composable
 */

import { useTheme } from '@/utils/theme'

export function useDark() {
  const theme = useTheme()
  
  const isDark = computed(() => useAppStore().getIsDark)
  
  const toggle = () => theme.toggleDark()
  
  return {
    isDark,
    toggle
  }
}
