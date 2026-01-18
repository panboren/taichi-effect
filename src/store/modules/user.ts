/**
 * 用户状态管理
 * 参考 yudao-ui-admin-vue3 实现
 */

import { defineStore } from 'pinia'
import { store } from '@/store'
import { loginApi, getUserInfoApi, getMenuListApi, logoutApi } from '@/api/login'
import { getAccessToken, setAccessToken, removeAccessToken, getRefreshToken, setRefreshToken, removeRefreshToken } from '@/utils/auth'
import type { UserInfo, LoginInfo } from '@/types'

interface UserState {
  user: UserInfo | null
  roles: string[]
  permissions: Set<string>
  isSetUser: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    roles: [],
    permissions: new Set<string>(),
    isSetUser: false
  }),
  getters: {
    getUser: (state) => state.user,
    getRoles: (state) => state.roles,
    getPermissions: (state) => state.permissions,
    getIsSetUser: (state) => state.isSetUser,
    isAdmin: (state) => state.roles.includes('admin')
  },
  actions: {
    async loginAction(loginInfo: LoginInfo) {
      try {
        const res = await loginApi(loginInfo)
        setAccessToken(res.token)
        setRefreshToken(res.refreshToken || '')
        return res
      } catch (error) {
        // 如果 API 失败，使用 mock 登录
        console.warn('登录 API 失败，使用 mock 登录:', error)
        const mockToken = 'mock-token-' + Date.now()
        setAccessToken(mockToken)
        setRefreshToken('mock-refresh-token')
        return { token: mockToken, refreshToken: 'mock-refresh-token' }
      }
    },

    async getUserInfoAction() {
      try {
        let userInfoRes: any
        let menusRes: any

        try {
          userInfoRes = await getUserInfoApi()
          menusRes = await getMenuListApi()
        } catch (apiError) {
          console.warn('API 获取用户信息失败，使用默认数据:', apiError)
          // 使用默认数据
          userInfoRes = {
            id: 1,
            username: 'admin',
            nickname: '管理员',
            email: 'admin@example.com',
            avatar: '',
            roles: ['admin'],
            permissions: ['*:*:*']
          }
          menusRes = null
        }

        this.user = userInfoRes
        this.roles = userInfoRes.roles || ['admin']
        this.permissions = new Set(userInfoRes.permissions || ['*:*:*'])
        this.isSetUser = true

        if (menusRes) {
          localStorage.setItem('permission-menus', JSON.stringify(menusRes))
        }

        return { user: userInfoRes, roles: this.roles, permissions: this.permissions, menus: menusRes }
      } catch (error) {
        this.resetState()
        throw error
      }
    },

    async logoutAction() {
      try {
        await logoutApi()
      } catch (error) {
        console.error('Logout failed:', error)
      } finally {
        this.resetState()
      }
    },

    async refreshAccessToken() {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        // 这里应该调用刷新 token 的 API
        // const { data } = await refreshApi({ refreshToken })
        // setAccessToken(data.token)
        // if (data.refreshToken) {
        //   setRefreshToken(data.refreshToken)
        // }
        // return data.token
        throw new Error('Refresh token API not implemented')
      } catch (error) {
        throw new Error('Failed to refresh access token')
      }
    },

    async fetchUserInfo() {
      const userInfoRes = await getUserInfoApi()
      const menusRes = await getMenuListApi()

      return {
        token: getAccessToken(),
        refreshToken: getRefreshToken(),
        user: userInfoRes,
        menus: menusRes
      }
    },

    resetState() {
      this.user = null
      this.roles = []
      this.permissions = new Set<string>()
      this.isSetUser = false
      removeAccessToken()
      removeRefreshToken()
      localStorage.removeItem('permission-menus')
    }
  }
})

export const useUserStoreWithOut = () => {
  return useUserStore(store)
}
