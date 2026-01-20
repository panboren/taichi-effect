// typescript
// 文件：src/integrations/vue-taichi-plugin.ts
import type { App } from 'vue'
import { TaichiThreeBridge, TaichiThreeOptions } from './taichi-three-plugin'

export type TaichiFactory = (opts?: TaichiThreeOptions) => TaichiThreeBridge

export default {
  install(app: App, globalOptions?: TaichiThreeOptions) {
    // 注入全局工厂函数：在组件中可用 this.$createTaichiBridge(...)
    const factory: TaichiFactory = (opts = {}) => new TaichiThreeBridge({ ...(globalOptions || {}), ...(opts || {}) })
    // @ts-ignore
    app.config.globalProperties.$createTaichiBridge = factory
    app.provide('$createTaichiBridge', factory)
  }
}
