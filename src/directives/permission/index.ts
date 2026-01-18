/**
 * 权限指令
 * 用于控制按钮级别的权限显示
 */

import type { Directive, DirectiveBinding } from 'vue'
import { useUserStoreWithOut } from '@/store/modules/user'

const ALL_PERMISSION = '*:*:*'

const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding
    const userStore = useUserStoreWithOut()
    const { permissions, isAdmin } = userStore

    if (!value) {
      return
    }

    let hasPermission = false

    if (isAdmin || permissions.has(ALL_PERMISSION)) {
      hasPermission = true
    } else if (Array.isArray(value)) {
      hasPermission = value.some((perm) => permissions.has(perm))
    } else {
      hasPermission = permissions.has(value)
    }

    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding
    const userStore = useUserStoreWithOut()
    const { permissions, isAdmin } = userStore

    if (!value) {
      return
    }

    let hasPermission = false

    if (isAdmin || permissions.has(ALL_PERMISSION)) {
      hasPermission = true
    } else if (Array.isArray(value)) {
      hasPermission = value.some((perm) => permissions.has(perm))
    } else {
      hasPermission = permissions.has(value)
    }

    if (!hasPermission && el.parentNode) {
      el.style.display = 'none'
    } else {
      el.style.display = ''
    }
  }
}

export default permission

