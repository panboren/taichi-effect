/**
 * Loading 指令
 * 用于在元素上显示加载状态
 */

import type { Directive, DirectiveBinding } from 'vue'
import { ElLoading } from 'element-plus'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'

const appLoading: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<boolean>) {
    const instance = ElLoading.service({
      target: el,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)',
      customClass: 'global-loading'
    })
    ;(el as any)._loadingInstance = instance
    
    if (!binding.value) {
      instance.close()
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<boolean>) {
    const instance = (el as any)._loadingInstance as LoadingInstance
    
    if (binding.value) {
      instance.open()
    } else {
      instance.close()
    }
  },
  unmounted(el: HTMLElement) {
    const instance = (el as any)._loadingInstance as LoadingInstance
    instance?.close()
  }
}

export default appLoading
