/**
 * 消息提示 Hook
 */

import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { MessageBoxData, NotificationParams } from 'element-plus'

export function useMessage() {
  const success = (message: string) => {
    ElMessage.success(message)
  }

  const error = (message: string) => {
    ElMessage.error(message)
  }

  const warning = (message: string) => {
    ElMessage.warning(message)
  }

  const info = (message: string) => {
    ElMessage.info(message)
  }

  const confirm = (
    message: string,
    title: string = '提示',
    options: any = {}
  ): Promise<string | number | undefined> => {
    return ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      ...options
    })
  }

  const alert = (
    message: string,
    title: string = '提示',
    options: any = {}
  ): Promise<MessageBoxData> => {
    return ElMessageBox.alert(message, title, {
      confirmButtonText: '确定',
      ...options
    })
  }

  const prompt = (
    message: string,
    title: string = '提示',
    options: any = {}
  ): Promise<MessageBoxData> => {
    return ElMessageBox.prompt(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      ...options
    })
  }

  const notify = (options: NotificationParams) => {
    ElNotification(options)
  }

  return {
    success,
    error,
    warning,
    info,
    confirm,
    alert,
    prompt,
    notify
  }
}
