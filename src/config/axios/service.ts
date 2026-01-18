/**
 * Axios 封装（企业级，支持请求取消、重试、刷新token）
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'
import config from './config'
import errorCode from './errorCode'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAccessToken, removeToken, setAccessToken, getRefreshToken } from '@/utils/auth'
import type { RequestConfig } from './config'
import router from '@/router'

interface PendingRequest {
  config: InternalAxiosRequestConfig
  resolve: (value: any) => void
}

const pendingRequests = new Map<string, PendingRequest>()
const isRefreshing = false
const refreshSubscribers: ((token: string) => void)[] = []

const generateRequestKey = (config: InternalAxiosRequestConfig): string => {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

const addPendingRequest = (config: InternalAxiosRequestConfig): void => {
  const key = generateRequestKey(config)
  if (!config.cancelRequest) {
    return
  }

  const controller = new AbortController()
  config.signal = controller.signal

  pendingRequests.set(key, {
    config,
    resolve: () => controller.abort()
  })
}

const removePendingRequest = (config: InternalAxiosRequestConfig): void => {
  const key = generateRequestKey(config)
  if (pendingRequests.has(key)) {
    const { resolve } = pendingRequests.get(key)!
    resolve(config)
    pendingRequests.delete(key)
  }
}

const subscribeTokenRefresh = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string): void => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers.length = 0
}

const service: AxiosInstance = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout,
  withCredentials: config.withCredentials
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    removePendingRequest(config)
    addPendingRequest(config)

    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  async (response: AxiosResponse) => {
    const { data } = response
    const config = response.config as RequestConfig

    removePendingRequest(config)

    if (config.isReturnNativeResponse) {
      return response
    }

    if (config.isTransformResponse === false) {
      return data
    }

    if (response.config.responseType === 'blob') {
      return response
    }

    if (data.code === undefined) {
      return data
    }

    if (data.code === 0) {
      return data.data || data
    }

    const errorMessage = data.msg || errorCode[data.code as keyof typeof errorCode] || '系统未知错误'

    if (data.code === 401) {
      if (!isRefreshing) {
        isRefreshing = true

        try {
          const refreshToken = getRefreshToken()
          if (refreshToken) {
            const { data: loginData } = await axios.post(`${config.baseURL}/auth/refresh`, {
              refreshToken
            })

            const newToken = loginData.token
            setAccessToken(newToken)

            onTokenRefreshed(newToken)

            const originalRequest = config as InternalAxiosRequestConfig & { _retry?: boolean }
            originalRequest._retry = true
            originalRequest.headers.Authorization = `Bearer ${newToken}`

            return service(originalRequest)
          } else {
            await ElMessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
              confirmButtonText: '重新登录',
              cancelButtonText: '取消',
              type: 'warning'
            })
            removeToken()
            window.location.reload()
            return Promise.reject(new Error(errorMessage))
          }
        } catch (error) {
          await ElMessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          })
          removeToken()
          window.location.reload()
          return Promise.reject(error)
        } finally {
          isRefreshing = false
        }
      } else {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            const originalRequest = config as InternalAxiosRequestConfig
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(service(originalRequest))
          })
        })
      }
    }

    if (config.showErrorMessage !== false) {
      ElMessage.error(errorMessage)
    }

    return Promise.reject(new Error(errorMessage))
  },
  async (error: AxiosError) => {
    const { config, response } = error as { config: InternalAxiosRequestConfig & { _retryCount?: number }, response?: any }
    let errorMessage = '请求错误'

    if (config) {
      removePendingRequest(config)
    }

    if (axios.isCancel(error)) {
      return Promise.reject({ message: '请求已取消', canceled: true })
    }

    if (response) {
      const { data, status } = response
      errorMessage = data?.msg || errorCode[status as keyof typeof errorCode] || errorMessage

      const isRetryable =
        status === 502 ||
        status === 503 ||
        status === 504 ||
        (config._retryCount !== undefined && config._retryCount < 3)

      if (isRetryable) {
        config._retryCount = config._retryCount || 0

        if (config._retryCount < 3) {
          config._retryCount++
          const delay = 1000 * Math.pow(2, config._retryCount)
          await new Promise((resolve) => setTimeout(resolve, delay))
          return service(config)
        }
      }
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage.error(errorMessage)
    return Promise.reject(error)
  }
)

export default service


