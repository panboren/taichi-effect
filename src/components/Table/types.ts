/**
 * Table 组件类型定义
 */

import type { TableColumnCtx } from 'element-plus'

export interface ColumnProps {
  type?: 'selection' | 'index' | 'expand'
  prop?: string
  label?: string
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean | 'custom'
  sortMethod?: (a: any, b: any) => number
  sortBy?: string | string[] | ((row: any) => string)
  sortOrders?: ('ascending' | 'descending' | null)[]
  resizable?: boolean
  formatter?: (row: any, column: TableColumnCtx<any>, cellValue: any, index: number) => VNode | string
  showOverflowTooltip?: boolean
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
  className?: string
  labelClassName?: string
  selectable?: (row: any, index: number) => boolean
  reserveSelection?: boolean
  filters?: object[]
  filterPlacement?: string
  filterMultiple?: boolean
  filterMethod?: (value: any, row: any, column: TableColumnCtx<any>) => boolean
  filteredValue?: any[]
  slot?: string
  header?: boolean
}

export interface TableProps {
  data: any[]
  columns: ColumnProps[]
  height?: string | number
  maxHeight?: string | number
  stripe?: boolean
  border?: boolean
  size?: 'large' | 'default' | 'small'
  fit?: boolean
  showHeader?: boolean
  highlightCurrentRow?: boolean
  currentRowKey?: string | number
  rowClassName?: string | ((row: any, rowIndex: number) => string)
  rowStyle?: object | ((row: any, rowIndex: number) => object)
  cellClassName?: string | ((row: any, column: TableColumnCtx<any>, rowIndex: number) => string)
  cellStyle?: object | ((row: any, column: TableColumnCtx<any>, rowIndex: number) => object)
  headerRowClassName?: string | ((row: any, rowIndex: number) => string)
  headerRowStyle?: object | ((row: any, rowIndex: number) => object)
  headerCellClassName?: string | ((row: any, column: TableColumnCtx<any>, rowIndex: number) => string)
  headerCellStyle?: object | ((row: any, column: TableColumnCtx<any>, rowIndex: number) => object)
  rowKey?: string | ((row: any) => string)
  emptyText?: string
  defaultExpandAll?: boolean
  expandRowKeys?: (string | number)[]
  defaultSort?: { prop: string; order: string }
  tooltipEffect?: 'dark' | 'light'
  showSummary?: boolean
  sumText?: string
  summaryMethod?: (param: { columns: any[]; data: any[] }) => string[]
  spanMethod?: (param: { row: any; column: any; rowIndex: number; columnIndex: number }) => number[] | number
  selectOnIndeterminate?: boolean
  indent?: number
  lazy?: boolean
  load?: (row: any, treeNode: unknown, resolve: (date: any[]) => void) => void
  treeProps?: { hasChildren?: string; children?: string; label?: string; disabled?: string }
  scrollbarAlwaysOn?: boolean
  flexible?: boolean
  currentPage?: number
  pageSize?: number
  total?: number
  pageSizes?: number[]
  paginationLayout?: string
  paginationBackground?: boolean
  paginationSmall?: boolean
  paginationDisabled?: boolean
}
