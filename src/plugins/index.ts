/**
 * 插件统一导出
 */

import type { App } from 'vue'
import setupDirectives from '@/directives'

export function setupPlugins(app: App) {
  // 注册指令
  setupDirectives(app)
}
