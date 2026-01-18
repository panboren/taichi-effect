/**
 * 路由守卫
 * 简化版 - 移除权限检查和动态路由
 */

import router from '@/router'
import { PageEnum } from '@/enums/pageEnum'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({
  showSpinner: false,
  easing: 'ease',
  speed: 500,
  trickleSpeed: 200,
  minimum: 0.3
})

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  next()
})

router.afterEach((to) => {
  NProgress.done()

  if (to.meta?.title) {
    document.title = `${to.meta.title} - ${import.meta.env.VITE_APP_TITLE}`
  }

  window.scrollTo(0, 0)
})

router.onError((error) => {
  console.error('路由错误:', error)
  NProgress.done()
})

export default router

