/**
 * 用户管理 API
 */

import request from '@/config/axios'
import type { UserInfo, PageParams, PageResult } from '@/types'

/**
 * 获取用户列表
 */
export const getUserPage = (params: PageParams) => {
  return request.get<PageResult<UserInfo>>({
    url: '/system/user/page',
    params
  })
}

/**
 * 获取用户详情
 */
export const getUserInfo = (id: number) => {
  return request.get<UserInfo>({
    url: `/system/user/${id}`
  })
}

/**
 * 新增用户
 */
export const createUser = (data: UserInfo) => {
  return request.post({
    url: '/system/user',
    data
  })
}

/**
 * 更新用户
 */
export const updateUser = (data: UserInfo) => {
  return request.put({
    url: '/system/user',
    data
  })
}

/**
 * 删除用户
 */
export const deleteUser = (id: number) => {
  return request.delete({
    url: `/system/user/${id}`
  })
}

/**
 * 批量删除用户
 */
export const deleteUserBatch = (ids: number[]) => {
  return request.delete({
    url: '/system/user/batch',
    data: { ids }
  })
}

/**
 * 导出用户
 */
export const exportUser = (params: PageParams) => {
  return request.download({
    url: '/system/user/export',
    params
  })
}


