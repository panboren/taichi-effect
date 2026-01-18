import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno({
      dark: 'class',
      attributify: false
    }),
    presetAttributify(),
    presetIcons()
  ],
  shortcuts: {
    'wh-full': 'w-full h-full',
    'flex-center': 'flex justify-center items-center',
    'flex-between': 'flex justify-between items-center',
    'flex-col-center': 'flex flex-col justify-center items-center',
    'absolute-center': 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  },
  theme: {
    colors: {
      primary: {
        DEFAULT: 'var(--el-color-primary)',
        light: 'var(--el-color-primary-light-3)',
        lighter: 'var(--el-color-primary-light-5)'
      }
    }
  }
})
