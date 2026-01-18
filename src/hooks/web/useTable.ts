/**
 * 表格 Hook
 */

import { ref, reactive, computed } from 'vue'
import type { Ref } from 'vue'
import type { PageParams, PageResult } from '@/types'

export interface TableObject {
  tableList: any[]
  loading: boolean
  total: number
  pageParams: PageParams
  selectedRows: any[]
  sortInfo: { prop?: string; order?: 'ascending' | 'descending' | null }
}

export interface TableOptions {
  getListApi: (params: PageParams) => Promise<PageResult>
  delListApi?: (ids: string[]) => Promise<void>
  exportListApi?: (params: PageParams) => Promise<Blob>
  defaultParams?: Partial<PageParams>
  enableSelection?: boolean
  enableSort?: boolean
}

export function useTable(options: TableOptions) {
  const {
    getListApi,
    delListApi,
    exportListApi,
    defaultParams = {},
    enableSelection = true,
    enableSort = true
  } = options

  const elTableRef = ref()
  const selectedRowKeys = ref<any[]>([])
  const selectionType = ref<'multiple' | 'single' | 'none'>('multiple')

  const tableObject = reactive<TableObject>({
    tableList: [],
    loading: false,
    total: 0,
    pageParams: {
      pageNo: 1,
      pageSize: 10,
      ...defaultParams
    },
    selectedRows: [],
    sortInfo: {}
  })

  const hasSelection = computed(() => tableObject.selectedRows.length > 0)
  const isAllSelected = computed(
    () =>
      tableObject.tableList.length > 0 &&
      tableObject.tableList.every((row) => selectedRowKeys.value.includes(row.id))
  )
  const isIndeterminate = computed(
    () =>
      tableObject.tableList.length > 0 &&
      !isAllSelected.value &&
      tableObject.tableList.some((row) => selectedRowKeys.value.includes(row.id))
  )

  const getList = async () => {
    tableObject.loading = true
    try {
      const params = {
        ...tableObject.pageParams,
        ...(enableSort && tableObject.sortInfo.prop
          ? { orderByColumn: tableObject.sortInfo.prop, isAsc: tableObject.sortInfo.order === 'ascending' }
          : {})
      }
      const { list, total } = await getListApi(params)
      tableObject.tableList = list
      tableObject.total = total
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      tableObject.loading = false
    }
  }

  const setSearchParams = (params: any) => {
    tableObject.pageParams = {
      ...tableObject.pageParams,
      ...params,
      pageNo: 1
    }
    getList()
  }

  const setPageSize = (pageSize: number) => {
    tableObject.pageParams.pageSize = pageSize
    getList()
  }

  const setPageNo = (pageNo: number) => {
    tableObject.pageParams.pageNo = pageNo
    getList()
  }

  const handleSortChange = ({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) => {
    tableObject.sortInfo = { prop, order }
    getList()
  }

  const handleSelectionChange = (selection: any[]) => {
    tableObject.selectedRows = selection
    selectedRowKeys.value = selection.map((row) => row.id)
  }

  const handleSelectAll = (selection: any[]) => {
    handleSelectionChange(selection)
  }

  const toggleRowSelection = (row: any, selected?: boolean) => {
    elTableRef.value?.toggleRowSelection(row, selected)
  }

  const toggleAllSelection = () => {
    elTableRef.value?.toggleAllSelection()
  }

  const clearSelection = () => {
    elTableRef.value?.clearSelection()
    tableObject.selectedRows = []
    selectedRowKeys.value = []
  }

  const selectRow = (row: any) => {
    elTableRef.value?.clearSelection()
    elTableRef.value?.toggleRowSelection(row, true)
  }

  const delList = async (ids?: string[]) => {
    if (!delListApi) return false

    const deleteIds = ids || tableObject.selectedRows.map((row) => row.id)

    if (!deleteIds || deleteIds.length === 0) {
      return false
    }

    try {
      await delListApi(deleteIds)
      clearSelection()
      await getList()
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const exportList = async (fileName: string = 'export') => {
    if (!exportListApi) return false

    try {
      const blob = await exportListApi(tableObject.pageParams)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const reset = () => {
    tableObject.pageParams = {
      pageNo: 1,
      pageSize: 10,
      ...defaultParams
    }
    tableObject.sortInfo = {}
    clearSelection()
  }

  return {
    elTableRef,
    tableObject,
    selectedRowKeys,
    selectionType,
    hasSelection,
    isAllSelected,
    isIndeterminate,
    methods: {
      getList,
      setSearchParams,
      setPageSize,
      setPageNo,
      handleSortChange,
      handleSelectionChange,
      handleSelectAll,
      toggleRowSelection,
      toggleAllSelection,
      clearSelection,
      selectRow,
      delList,
      exportList,
      reset
    }
  }
}

