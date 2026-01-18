/**
 * Axios 配置
 * 参考 yudao-ui-admin-vue3 实现
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Result } from '@/types'
import { getAccessToken, removeAccessToken } from '@/utils/auth'
import router from '@/router'
import NProgress from 'nprogress'

// 是否显示刷新Token的弹窗
let isRelogin = { show: false }

// axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 10000, // 10秒超时
  withCredentials: true
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 不需要 Token 的请求
    if (config.headers?.isToken === false) {
      return config
    }

    // 添加 Token
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<Result>) => {
    const res = response.data

    // 二进制数据直接返回
    if (
      response.request.responseType === 'blob' ||
      response.request.responseType === 'arraybuffer'
    ) {
      return res
    }

    // Code 不为 0 判断为错误
    if (res.code !== 0) {
      ElMessage.error(res.msg || '系统未知错误')

      // 特殊 Code 处理
      if (res.code === 401) {
        handle401()
      }
      return Promise.reject(new Error(res.msg || '系统未知错误'))
    }

    return res
  },
  (error: AxiosError<Result>) => {
    const { response, message, config } = error

    // 请求被取消
    if (error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }

    NProgress.done()

    const msg = response?.data?.msg || message || '系统未知错误'

    // 处理 401 错误
    if (response?.status === 401) {
      handle401()
      return Promise.reject(error)
    }

    // 处理 403 错误
    if (response?.status === 403) {
      ElMessage.error('没有权限访问')
      return Promise.reject(error)
    }

    // 处理 404 错误
    if (response?.status === 404) {
      ElMessage.error('请求的资源不存在')
      return Promise.reject(error)
    }

    // 处理 500 错误
    if (response?.status === 500) {
      ElMessage.error('服务器错误')
      return Promise.reject(error)
    }

    // 处理网络错误
    if (!response) {
      if (message.includes('timeout')) {
        ElMessage.error('请求超时')
      } else if (message.includes('Network Error')) {
        ElMessage.error('网络错误')
      } else {
        ElMessage.error(msg)
      }
      return Promise.reject(error)
    }

    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

/**
 * 处理 401 未授权
 */
const handle401 = () => {
  if (isRelogin.show) {
    return
  }

  isRelogin.show = true
  ElMessageBox.confirm(
    '登录状态已过期，您可以继续留在该页面，或者重新登录',
    '系统提示',
    {
      confirmButtonText: '重新登录',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      removeAccessToken()
      // 清除存储的用户信息
      localStorage.removeItem('permission-menus')
      // 如果不在登录页，跳转到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      isRelogin.show = false
    })
    .catch(() => {
      isRelogin.show = false
    })
}

/**
 * 请求方法
 */
export const request = <T = any, R = Result<T>>(
  config: AxiosRequestConfig
): Promise<R> => {
  return service.request(config)
}

/**
 * GET 请求
 */
export const get = <T = any, R = Result<T>>(
  url: string,
  config?: AxiosRequestConfig
): Promise<R> => {
  return service.get(url, config)
}

/**
 * POST 请求
 */
export const post = <T = any, R = Result<T>>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<R> => {
  return service.post(url, data, config)
}

/**
 * PUT 请求
 */
export const put = <T = any, R = Result<T>>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<R> => {
  return service.put(url, data, config)
}

/**
 * DELETE 请求
 */
export const del = <T = any, R = Result<T>>(
  url: string,
  config?: AxiosRequestConfig
): Promise<R> => {
  return service.delete(url, config)
}

/**
 * 上传文件
 */
export const upload = <T = any, R = Result<T>>(
  url: string,
  file: File | FormData,
  config?: AxiosRequestConfig
): Promise<R> => {
  const formData = file instanceof FormData ? file : new FormData()
  if (file instanceof File) {
    formData.append('file', file)
  }
  return service.post(url, formData, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...config?.headers
    }
  })
}

/**
 * 下载文件
 */
export const download = (
  url: string,
  filename?: string,
  config?: AxiosRequestConfig
) => {
  return service
    .get(url, {
      ...config,
      responseType: 'blob'
    })
    .then((response) => {
      const blob = new Blob([response.data])
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename || 'download'
      link.click()
      URL.revokeObjectURL(link.href)
    })
}

export default service
