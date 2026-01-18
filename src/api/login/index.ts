/**
 * 登录 API
 */

import { post, get } from '@/config/axios'
import type { LoginInfo, UserInfo } from '@/types'

/**
 * 登录
 */
export const loginApi = (data: LoginInfo) => {
  return post('/auth/login', data)
}

/**
 * 获取用户信息
 */
export const getUserInfoApi = () => {
  return get<UserInfo>('/auth/info')
}

/**
 * 获取菜单列表
 */
export const getMenuListApi = () => {
  return get('/auth/menus')
}

/**
 * 退出登录
 */
export const logoutApi = () => {
  return post('/auth/logout')
}




