/**
 * 动态路由
 */

import type { AppRouteRecordRaw } from '@/types'

export const asyncRoutes: AppRouteRecordRaw[] = [
  {
    path: '/system',
    name: 'System',
    meta: {
      title: '系统管理',
      icon: 'Setting'
    },
    children: [
      {
        path: '/system/user',
        name: 'User',
        component: () => import('@/views/system/user/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'User'
        }
      },
      {
        path: '/system/role',
        name: 'Role',
        component: () => import('@/views/system/role/index.vue'),
        meta: {
          title: '角色管理',
          icon: 'Lock'
        }
      },
      {
        path: '/system/menu',
        name: 'Menu',
        component: () => import('@/views/system/menu/index.vue'),
        meta: {
          title: '菜单管理',
          icon: 'Menu'
        }
      }
    ]
  }
]

export default asyncRoutes

