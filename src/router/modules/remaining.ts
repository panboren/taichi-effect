/**
 * 静态路由
 */

import type { AppRouteRecordRaw } from '@/types'

export const remainingRouter: AppRouteRecordRaw[] = [
  {
    path: '/redirect',
    component: () => import('@/views/Redirect/index.vue'),
    meta: {
      hidden: true
    }
  }
]

export default remainingRouter
