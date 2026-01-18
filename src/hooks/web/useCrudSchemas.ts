/**
 * CRUD 模式 Hook
 */

import type { FormSchema, TableColumn } from '@/types'

export interface CrudSchemas {
  searchSchema?: FormSchema[]
  tableColumns?: TableColumn[]
  formSchema?: FormSchema[]
  detailSchema?: any[]
}

export interface UseCrudSchemasOptions {
  allSchemas?: CrudSchemas
}

export function useCrudSchemas(options: UseCrudSchemasOptions = {}) {
  const { allSchemas = {} } = options

  const getSearchSchema = () => {
    return allSchemas.searchSchema || []
  }

  const getTableColumns = () => {
    return allSchemas.tableColumns || []
  }

  const getFormSchema = () => {
    return allSchemas.formSchema || []
  }

  const getDetailSchema = () => {
    return allSchemas.detailSchema || []
  }

  return {
    allSchemas,
    methods: {
      getSearchSchema,
      getTableColumns,
      getFormSchema,
      getDetailSchema
    }
  }
}
