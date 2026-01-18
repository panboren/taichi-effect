/**
 * 权限指令
 * 用法：v-permission="['admin', 'editor']"
 */

import type { Directive, DirectiveBinding } from 'vue'
import { useUserStoreWithOut } from '@/store/modules/user'

const userStore = useUserStoreWithOut()

/**
 * 检查权限
 */
const checkPermission = (el: HTMLElement, binding: DirectiveBinding) => {
  const { value } = binding
  const permissions = userStore.getPermissions

  if (value && value instanceof Array && value.length > 0) {
    const hasPermission = value.some((permission: string) =>
      permissions.has(permission)
    )

    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  } else {
    throw new Error('need permissions! Like v-permission="[\'system:user:add\',\'system:user:edit\']"')
  }
}

const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  }
}

export default permission
