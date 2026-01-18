/**
 * 认证工具
 */

const TOKEN_KEY = 'ACCESS_TOKEN'
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN'
const TENANT_ID_KEY = 'TENANT_ID'

export const getAccessToken = (): string => {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export const setAccessToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const getRefreshToken = (): string => {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeAccessToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

export const removeRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const removeToken = (): void => {
  removeAccessToken()
  removeRefreshToken()
}

export const getTenantId = (): string => {
  return localStorage.getItem(TENANT_ID_KEY) || '1'
}

export const setTenantId = (tenantId: string): void => {
  localStorage.setItem(TENANT_ID_KEY, tenantId)
}
