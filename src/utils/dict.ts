/**
 * 字典工具
 */

import { ref } from 'vue'

export type DictDataType = {
  label: string
  value: any
  colorType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  color?: string
  [key: string]: any
}

export type StringDictDataType = {
  label: string
  value: string
  colorType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  color?: string
}

export type NumberDictDataType = {
  label: string
  value: number
  colorType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  color?: string
}

export type BoolDictDataType = {
  label: string
  value: boolean
  colorType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  color?: string
}

const DICT_CACHE_KEY = 'dict_cache'
const CACHE_EXPIRY = 30 * 60 * 1000

const dictCache = ref<Map<string, { data: DictDataType[]; time: number }>>(new Map())

function loadCache() {
  const cacheStr = localStorage.getItem(DICT_CACHE_KEY)
  if (cacheStr) {
    try {
      const cache = JSON.parse(cacheStr)
      const now = Date.now()
      Object.entries(cache).forEach(([key, value]: [string, any]) => {
        if (now - value.time < CACHE_EXPIRY) {
          dictCache.value.set(key, value)
        }
      })
    } catch (e) {
      console.error('Failed to load dict cache:', e)
    }
  }
}

function saveCache() {
  const cacheObj: Record<string, any> = {}
  dictCache.value.forEach((value, key) => {
    cacheObj[key] = value
  })
  localStorage.setItem(DICT_CACHE_KEY, JSON.stringify(cacheObj))
}

loadCache()

export async function fetchDictData(dictType: string): Promise<DictDataType[]> {
  try {
    const response = await fetch(`/system/dict/data/type/${dictType}`)
    const { data } = await response.json()
    return data || []
  } catch (error) {
    console.error(`Failed to fetch dict data for type ${dictType}:`, error)
    return []
  }
}

export async function getDictOptions(dictType: string): Promise<DictDataType[]> {
  const cached = dictCache.value.get(dictType)
  const now = Date.now()

  if (cached && now - cached.time < CACHE_EXPIRY) {
    return cached.data
  }

  const data = await fetchDictData(dictType)
  dictCache.value.set(dictType, { data, time: now })
  saveCache()

  return data
}

export function getSyncDictOptions(dictType: string): DictDataType[] {
  const cached = dictCache.value.get(dictType)
  return cached ? cached.data : []
}

export function setDictOptions(dictType: string, data: DictDataType[]) {
  dictCache.value.set(dictType, { data, time: Date.now() })
  saveCache()
}

export async function getStrDictOptions(dictType: string): Promise<StringDictDataType[]> {
  const options = await getDictOptions(dictType)
  return options.filter((item) => typeof item.value === 'string')
}

export async function getIntDictOptions(dictType: string): Promise<NumberDictDataType[]> {
  const options = await getDictOptions(dictType)
  return options.filter((item) => typeof item.value === 'number')
}

export async function getBoolDictOptions(dictType: string): Promise<BoolDictDataType[]> {
  const options = await getDictOptions(dictType)
  return options.filter((item) => typeof item.value === 'boolean')
}

export async function getDictObj(dictType: string, value: any): Promise<DictDataType | undefined> {
  const options = await getDictOptions(dictType)
  return options.find((item) => item.value === value)
}

export async function getDictLabel(dictType: string, value: any): Promise<string> {
  const dictObj = await getDictObj(dictType, value)
  return dictObj?.label || ''
}

export async function getDictColor(dictType: string, value: any): Promise<string> {
  const dictObj = await getDictObj(dictType, value)
  return dictObj?.colorType || dictObj?.color || ''
}

export function clearDictCache(dictType?: string) {
  if (dictType) {
    dictCache.value.delete(dictType)
  } else {
    dictCache.value.clear()
  }
  saveCache()
}

export function refreshDictCache(dictType?: string) {
  clearDictCache(dictType)
}

