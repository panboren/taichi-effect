import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './permission' // 路由守卫必须在 mount 之前导入
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'virtual:uno.css'
import 'element-plus/dist/index.css'
import './styles/index.scss'
import 'virtual:svg-icons-register'
import { setupPlugins } from '@/plugins'
import i18n from './i18n'

// 核心模块
import { globalErrorHandler, performanceMonitor, serviceWorkerManager } from '@/core'
import componentsPlugin from '@/components'

// 清理可能存在的旧数据（开发环境下）
if (import.meta.env.DEV) {
  // 检查是否有无效的 token 或用户数据
  try {
    const token = localStorage.getItem('access-token')
    if (token && token.startsWith('mock-token')) {
      // 清理过期的 mock token
      const tokenTime = parseInt(token.split('-')[2])
      if (Date.now() - tokenTime > 3600000) { // 1小时过期
        localStorage.removeItem('access-token')
        localStorage.removeItem('refresh-token')
      }
    }
  } catch (e) {
    // 忽略错误
  }
}

const app = createApp(App)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(i18n)
app.use(componentsPlugin)

setupPlugins(app)

// 全局错误处理器
globalErrorHandler.install(app)

// 性能监控
performanceMonitor.install(app)

// Service Worker（生产环境）
if (import.meta.env.PROD) {
  serviceWorkerManager.register()
}

// 全局属性
app.config.globalProperties.$performance = performanceMonitor

app.mount('#app')

// 初始化主题（在 mount 之后调用）
import { useTheme } from '@/utils/theme'
useTheme().initTheme()

// 性能标记
performanceMonitor.mark('app-mounted')

// 检测首屏渲染
if (document.visibilityState === 'visible') {
  performanceMonitor.mark('first-contentful-paint')
}
