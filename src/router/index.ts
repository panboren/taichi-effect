/**
 * 路由配置
 * 简化版 - 只保留首页
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 静态路由 - 只保留首页
const routes = [
  {
    path: '/index',
    name: 'Home',
    component: () => import('@/views/Home/index.vue'),
    meta: {
      title: '首页',
      icon: 'HomeFilled'
    }
  },
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/index'
  }
]
/*const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/layout/index.vue'),
    redirect: '/index',
    meta: {
      title: '首页',
      icon: 'HomeFilled'
    },
    children: [
      {
        path: '/index',
        name: 'Index',
        component: () => import('@/views/Home/index.vue'),
        meta: {
          title: '首页',
          icon: 'HomeFilled',
          affix: true
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]*/

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_PATH),
  strict: true,
  routes,
  scrollBehavior: () => ({ top: 0 })
})

export const resetRouter = () => {
  // 简化版不需要重置路由
}

export default router
