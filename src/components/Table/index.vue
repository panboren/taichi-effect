<template>
  <div class="table-container">
    <el-table
      v-bind="$attrs"
      v-loading="loading"
      :data="data"
      :border="border"
      :stripe="stripe"
      :size="size"
      :height="height"
      :max-height="maxHeight"
      :fit="fit"
      :show-header="showHeader"
      :highlight-current-row="highlightCurrentRow"
      :current-row-key="currentRowKey"
      :row-class-name="rowClassName"
      :row-style="rowStyle"
      :cell-class-name="cellClassName"
      :cell-style="cellStyle"
      :header-row-class-name="headerRowClassName"
      :header-row-style="headerRowStyle"
      :header-cell-class-name="headerCellClassName"
      :header-cell-style="headerCellStyle"
      :row-key="rowKey"
      :empty-text="emptyText"
      :default-expand-all="defaultExpandAll"
      :expand-row-keys="expandRowKeys"
      :default-sort="defaultSort"
      :tooltip-effect="tooltipEffect"
      :show-summary="showSummary"
      :sum-text="sumText"
      :summary-method="summaryMethod"
      :span-method="spanMethod"
      :select-on-indeterminate="selectOnIndeterminate"
      :indent="indent"
      :lazy="lazy"
      :load="load"
      :tree-props="treeProps"
      :scrollbar-always-on="scrollbarAlwaysOn"
      :flexible="flexible"
      @select="handleSelect"
      @select-all="handleSelectAll"
      @selection-change="handleSelectionChange"
      @cell-mouse-enter="handleCellMouseEnter"
      @cell-mouse-leave="handleCellMouseLeave"
      @cell-click="handleCellClick"
      @cell-dblclick="handleCellDblclick"
      @row-click="handleRowClick"
      @row-contextmenu="handleRowContextmenu"
      @row-dblclick="handleRowDblclick"
      @header-click="handleHeaderClick"
      @header-contextmenu="handleHeaderContextmenu"
      @sort-change="handleSortChange"
      @filter-change="handleFilterChange"
      @current-change="handleCurrentChange"
      @header-dragend="handleHeaderDragend"
      @expand-change="handleExpandChange"
    >
      <!-- 表格列 -->
      <template v-for="column in columns" :key="column.prop || column.type">
        <el-table-column v-bind="column">
          <!-- 自定义表头 -->
          <template v-if="column.header" #header="scope">
            <slot :name="`${column.prop}-header`" v-bind="scope" />
          </template>

          <!-- 自定义单元格 -->
          <template v-if="column.slot" #default="scope">
            <slot :name="column.slot" v-bind="scope" />
          </template>
        </el-table-column>
      </template>

      <!-- 空数据 -->
      <template #empty>
        <slot name="empty">
          <el-empty :description="emptyText" />
        </slot>
      </template>
    </el-table>

    <!-- 分页 -->
    <div v-if="showPagination" class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="pageSizes"
        :layout="paginationLayout"
        :background="paginationBackground"
        :small="paginationSmall"
        :disabled="paginationDisabled"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TableProps, ColumnProps } from './types'

interface Props extends Partial<TableProps> {
  data: any[]
  columns: ColumnProps[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  border: true,
  stripe: true,
  size: 'default',
  fit: true,
  showHeader: true,
  showPagination: true,
  pageSizes: [10, 20, 50, 100],
  paginationLayout: 'total, sizes, prev, pager, next, jumper',
  paginationBackground: true,
  emptyText: '暂无数据'
})

const emit = defineEmits([
  'select',
  'select-all',
  'selection-change',
  'cell-mouse-enter',
  'cell-mouse-leave',
  'cell-click',
  'cell-dblclick',
  'row-click',
  'row-contextmenu',
  'row-dblclick',
  'header-click',
  'header-contextmenu',
  'sort-change',
  'filter-change',
  'current-change',
  'header-dragend',
  'expand-change',
  'size-change',
  'page-change',
  'update:currentPage',
  'update:pageSize'
])

const currentPage = ref(props.currentPage || 1)
const pageSize = ref(props.pageSize || 10)

watch(
  () => props.currentPage,
  (val) => {
    currentPage.value = val
  }
)

watch(
  () => props.pageSize,
  (val) => {
    pageSize.value = val
  }
)

// 事件处理
const handleSelect = (...args: any[]) => emit('select', ...args)
const handleSelectAll = (...args: any[]) => emit('select-all', ...args)
const handleSelectionChange = (...args: any[]) => emit('selection-change', ...args)
const handleCellMouseEnter = (...args: any[]) => emit('cell-mouse-enter', ...args)
const handleCellMouseLeave = (...args: any[]) => emit('cell-mouse-leave', ...args)
const handleCellClick = (...args: any[]) => emit('cell-click', ...args)
const handleCellDblclick = (...args: any[]) => emit('cell-dblclick', ...args)
const handleRowClick = (...args: any[]) => emit('row-click', ...args)
const handleRowContextmenu = (...args: any[]) => emit('row-contextmenu', ...args)
const handleRowDblclick = (...args: any[]) => emit('row-dblclick', ...args)
const handleHeaderClick = (...args: any[]) => emit('header-click', ...args)
const handleHeaderContextmenu = (...args: any[]) => emit('header-contextmenu', ...args)
const handleSortChange = (...args: any[]) => emit('sort-change', ...args)
const handleFilterChange = (...args: any[]) => emit('filter-change', ...args)
const handleCurrentChange = (...args: any[]) => emit('current-change', ...args)
const handleHeaderDragend = (...args: any[]) => emit('header-dragend', ...args)
const handleExpandChange = (...args: any[]) => emit('expand-change', ...args)

const handleSizeChange = (size: number) => {
  currentPage.value = 1
  emit('update:pageSize', size)
  emit('size-change', size)
}

const handlePageChange = (page: number) => {
  emit('update:currentPage', page)
  emit('page-change', page)
}
</script>

<style scoped lang="scss">
.table-container {
  .table-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
