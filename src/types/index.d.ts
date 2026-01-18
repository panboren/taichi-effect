/**
 * 通用类型定义
 */

export type Nullable<T> = T | null | undefined

export type Recordable<T = any> = Record<string, T>

export type TimeoutHandle = ReturnType<typeof setTimeout>

export type IntervalHandle = ReturnType<typeof setInterval>

export type Fn<T = any, R = T> = (...arg: T[]) => R

export type TargetContext = '_self' | '_blank'

export type ComponentElRef<T extends HTMLElement = HTMLDivElement> = {
  $el: T
  $props: any
} & AnyObject

export type LayoutMode = 'classic' | 'top' | 'mix' | 'mobile'

export interface AnyObject {
  [key: string]: any
}

export interface PageParams {
  pageNo: number
  pageSize: number
}

export interface PageResult<T = any> {
  list: T[]
  total: number
}

export interface ResponseResult<T = any> {
  code: number
  data: T
  msg: string
}

export interface TreeData {
  id: string | number
  label: string
  children?: TreeData[]
  disabled?: boolean
  [key: string]: any
}

// 表格列定义
export interface TableColumn {
  field: string
  label?: string
  width?: number | string
  minWidth?: number | string
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  children?: TableColumn[]
  [key: string]: any
}

// 表单定义
export interface FormSchema {
  field: string
  label?: string
  component?: string
  componentProps?: Recordable
  formItemProps?: Recordable
  colProps?: Recordable
  value?: any
  rules?: any[]
  hidden?: boolean
  [key: string]: any
}

// 路由元信息
export interface RouteMeta {
  title?: string
  icon?: string
  hidden?: boolean
  noCache?: boolean
  alwaysShow?: boolean
  affix?: boolean
  noTagsView?: boolean
  activeMenu?: string
  canTo?: boolean
  followAuth?: string
  roles?: string[]
  permissions?: string[]
  [key: string]: any
}

export interface AppRouteRecordRaw {
  path: string
  name?: string
  component?: any
  redirect?: string
  meta?: RouteMeta
  children?: AppRouteRecordRaw[]
  [key: string]: any
}

// 用户信息
export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  mobile: string
  deptId: number
  postIds: number[]
  status: number
  createTime: string
  [key: string]: any
}

// 登录信息
export interface LoginInfo {
  username: string
  password: string
  code?: string
  uuid?: string
  tenantId?: string
}

// 错误日志
export interface ErrorLog {
  type: 'vue' | 'promise' | 'window' | 'resource' | 'console' | 'manual'
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  info?: string
  url?: string
  time: string
  context?: Record<string, any>
}

// 错误捕获负载
export interface ErrorCapturedPayload {
  err: Error
  vm: any
  info: string
}

// Vue 组件错误
export interface ComponentError {
  err: Error
  vm: any
  info: string
}

// 性能指标
export interface PerformanceMetrics {
  FCP?: number
  LCP?: number
  FID?: number
  CLS?: number
  TTFB?: number
  firstRender?: number
  routeChange?: number
  apiRequest?: number[]
  slowResources?: PerformanceEntry[]
  longTasks?: PerformanceEntry[]
}

// 虚拟列表项
export interface VirtualListItem {
  id: string | number
  [key: string]: any
}

// 请求配置
export interface RequestConfig {
  signal?: AbortSignal
  [key: string]: any
}

// 图片预览配置
export interface ImagePreviewConfig {
  srcList: string[]
  initialIndex?: number
  modelValue: boolean
}

// 无限滚动配置
export interface InfiniteScrollConfig<T> {
  dataSource: T[]
  onLoadMore: (page: number) => Promise<T[]>
  pageSize?: number
  distance?: number
}

// 骨架屏配置
export interface SkeletonConfig {
  rows?: number
  titleRows?: number
  avatar?: boolean
  paragraph?: boolean
  title?: boolean
  animated?: boolean
}
