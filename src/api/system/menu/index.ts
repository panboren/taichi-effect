/**
 * 菜单管理 API
 */

import request from '@/config/axios'

export interface MenuInfo {
  id?: number
  name: string
  icon?: string
  path: string
  component?: string
  sort?: number
  visible?: boolean
  parentId?: number
  type?: 'menu' | 'button' | 'directory'
  permission?: string
  status?: number
  children?: MenuInfo[]
}

/**
 * 获取菜单列表（树形）
 */
export const getMenuList = () => {
  return request.get<MenuInfo[]>({
    url: '/system/menu/list'
  })
}

/**
 * 获取菜单详情
 */
export const getMenuInfo = (id: number) => {
  return request.get<MenuInfo>({
    url: `/system/menu/${id}`
  })
}

/**
 * 新增菜单
 */
export const createMenu = (data: MenuInfo) => {
  return request.post({
    url: '/system/menu',
    data
  })
}

/**
 * 更新菜单
 */
export const updateMenu = (data: MenuInfo) => {
  return request.put({
    url: '/system/menu',
    data
  })
}

/**
 * 删除菜单
 */
export const deleteMenu = (id: number) => {
  return request.delete({
    url: `/system/menu/${id}`
  })
}

/**
 * 获取用户菜单
 */
export const getUserMenus = () => {
  return request.get<MenuInfo[]>({
    url: '/system/menu/user'
  })
}
