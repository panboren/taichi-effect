/**
 * Axios 配置
 */

import type { AxiosRequestConfig } from 'axios'

const config = {
  // 开发环境直接连接 mock 服务器，不需要 /api 前缀
  baseURL: import.meta.env.DEV ? 'http://localhost:3000' : (import.meta.env.VITE_API_URL || '/api'),
  timeout: 10000,
  withCredentials: false,
  responseType: 'json',
  paramsSerializer: {
    indexes: null
  }
}

export default config

export interface RequestConfig extends AxiosRequestConfig {
  isTransformResponse?: boolean
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
  isReturnNativeResponse?: boolean
  ignoreCancelToken?: boolean
  cancelRequest?: boolean
  isFormData?: boolean
  isEncrypt?: boolean
  retryCount?: number
}
