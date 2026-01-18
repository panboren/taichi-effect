/**
 * 路由辅助工具
 * 参考 yudao-ui-admin-vue3 实现
 */

import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

// 组件映射表 - 自动导入所有 views 组件
const modules = import.meta.glob('../views/**/*.{vue,tsx}')

/**
 * 将后端菜单转换为前端路由
 */
export const generateRoute = (routes: any[]): RouteRecordRaw[] => {
  const res: RouteRecordRaw[] = []
  const modulesRoutesKeys = Object.keys(modules)

  for (const route of routes) {
    // 生成 meta 菜单元数据
    const meta = {
      title: route.meta?.title || route.name,
      icon: route.meta?.icon,
      hidden: !route.meta?.visible,
      noCache: !route.meta?.keepAlive,
      alwaysShow: route.children && route.children.length > 0,
      roles: route.meta?.roles,
      permissions: route.meta?.permissions
    } as any

    // 基础路由配置
    let data: RouteRecordRaw = {
      path: route.path,
      name: route.name,
      redirect: route.redirect,
      meta: meta
    } as any

    // 情况1：目录类型（有子路由）或 Layout 类型
    if (route.children && route.children.length > 0) {
      data.component = Layout
      data.redirect = route.redirect || (route.children[0].path.startsWith('/')
        ? route.children[0].path
        : `${route.path}/${route.children[0].path}`)
      // 递归处理子路由
      data.children = generateRoute(route.children)
    }
    // 情况2：普通菜单（有组件）
    else if (route.component) {
      const componentPath = String(route.component)

      // 如果是 Layout，直接使用 Layout 组件
      if (componentPath === 'Layout') {
        data.component = Layout
      } else {
        // 标准化路径
        const normalizedPath = componentPath
          .replace(/\/index$/, '')
          .replace('.vue', '')

        // 查找匹配的组件
        const matchedKey = modulesRoutesKeys.find((key) => {
          const keyPath = key
            .replace('../views/', '')
            .replace('.vue', '')
            .replace('/index', '')
          return keyPath === normalizedPath
        })

        if (matchedKey) {
          data.component = modules[matchedKey]
        } else {
          console.warn(`未找到组件: ${componentPath}`)
        }
      }
    }

    res.push(data as RouteRecordRaw)
  }

  return res
}
