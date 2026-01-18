/**
 * 组件自动注册入口
 */

import type { App } from 'vue'
import VirtualList from './VirtualList/index.vue'
import InfiniteScroll from './InfiniteScroll/index.vue'
import Skeleton from './Skeleton/index.vue'
import ErrorBoundary from './ErrorBoundary/index.vue'
import ImagePreview from './ImagePreview/index.vue'

const components = {
  VirtualList,
  InfiniteScroll,
  Skeleton,
  ErrorBoundary,
  ImagePreview
}

export function registerComponents(app: App) {
  Object.keys(components).forEach((key) => {
    app.component(key, (components as any)[key])
  })
}

export default {
  install: (app: App) => {
    registerComponents(app)
  }
}

export { VirtualList, InfiniteScroll, Skeleton, ErrorBoundary, ImagePreview }
