/**
 * 权限检查工具
 */

import { useUserStoreWithOut } from '@/store/modules/user'

const ALL_PERMISSION = '*:*:*'

export function checkPermission(permission: string | string[]): boolean {
  const userStore = useUserStoreWithOut()
  const { permissions, isAdmin } = userStore

  if (isAdmin) {
    return true
  }

  if (!permissions || permissions.size === 0) {
    return false
  }

  if (permissions.has(ALL_PERMISSION)) {
    return true
  }

  if (Array.isArray(permission)) {
    return permission.some((perm) => permissions.has(perm))
  }

  return permissions.has(permission)
}

export function checkRole(role: string | string[]): boolean {
  const userStore = useUserStoreWithOut()
  const { roles, isAdmin } = userStore

  if (isAdmin) {
    return true
  }

  if (!roles || roles.length === 0) {
    return false
  }

  if (Array.isArray(role)) {
    return role.some((r) => roles.includes(r))
  }

  return roles.includes(role)
}

export const vPermission = {
  mounted(el: HTMLElement, binding: { value: string | string[] }) {
    const { value } = binding
    if (value) {
      const hasPermission = checkPermission(value)
      if (!hasPermission) {
        el.parentNode?.removeChild(el)
      }
    }
  }
}

export const vRole = {
  mounted(el: HTMLElement, binding: { value: string | string[] }) {
    const { value } = binding
    if (value) {
      const hasRole = checkRole(value)
      if (!hasRole) {
        el.parentNode?.removeChild(el)
      }
    }
  }
}
