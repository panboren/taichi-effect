/**
 * 角色管理 API
 */

import request from '@/config/axios'
import type { PageParams, PageResult } from '@/types'

export interface RoleInfo {
  id?: number
  name: string
  code: string
  status?: number
  remark?: string
  sort?: number
  menuIds?: number[]
  createTime?: string
  updateTime?: string
}

/**
 * 获取角色列表
 */
export const getRolePage = (params: PageParams) => {
  return request.get<PageResult<RoleInfo>>({
    url: '/system/role/page',
    params
  })
}

/**
 * 获取所有角色
 */
export const getRoleAll = () => {
  return request.get<RoleInfo[]>({
    url: '/system/role/list'
  })
}

/**
 * 获取角色详情
 */
export const getRoleInfo = (id: number) => {
  return request.get<RoleInfo>({
    url: `/system/role/${id}`
  })
}

/**
 * 新增角色
 */
export const createRole = (data: RoleInfo) => {
  return request.post({
    url: '/system/role',
    data
  })
}

/**
 * 更新角色
 */
export const updateRole = (data: RoleInfo) => {
  return request.put({
    url: '/system/role',
    data
  })
}

/**
 * 删除角色
 */
export const deleteRole = (id: number) => {
  return request.delete({
    url: `/system/role/${id}`
  })
}

/**
 * 批量删除角色
 */
export const deleteRoleBatch = (ids: number[]) => {
  return request.delete({
    url: '/system/role/batch',
    data: { ids }
  })
}

/**
 * 分配角色菜单
 */
export const assignRoleMenu = (roleId: number, menuIds: number[]) => {
  return request.post({
    url: '/system/role/menu',
    data: { roleId, menuIds }
  })
}
