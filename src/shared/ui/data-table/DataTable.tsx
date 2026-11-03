import { Table } from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { ReactNode } from 'react'
import type { ApiError } from '@/shared/api/errors'
import { EmptyState } from '../empty-state/EmptyState'
import { ErrorState } from '../error-state/ErrorState'

export type SortState = { field: string; order: 'asc' | 'desc' } | null

export type DataTableProps<T extends object> = {
  columns: ColumnsType<T>
  rows: T[]
  rowKey: keyof T & string | ((row: T) => string)
  /** 联合类型，天然避免“载入中闪现空态” */
  status: 'loading' | 'error' | 'empty' | 'ready'
  error?: ApiError | null
  onRetry?: () => void
  empty?: { title: string; description?: string; action?: ReactNode }
  pagination: {
    page: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  sort?: SortState
  onSortChange?: (sort: SortState) => void
  toolbar?: ReactNode
  rowSelection?: TableProps<T>['rowSelection']
  scrollX?: number
}

function applySortOrder<T>(columns: ColumnsType<T>, sort?: SortState): ColumnsType<T> {
  return columns.map((column) => {
    const dataIndex = 'dataIndex' in column ? column.dataIndex : undefined
    const field = Array.isArray(dataIndex) ? dataIndex.join('.') : dataIndex
    const active = sort && String(field) === sort.field
    return {
      ...column,
      sortOrder: active ? (sort.order === 'asc' ? 'ascend' : 'descend') : null,
    }
  })
}

export function DataTable<T extends object>({
  columns,
  rows,
  rowKey,
  status,
  error,
  onRetry,
  empty,
  pagination,
  sort,
  onSortChange,
  toolbar,
  rowSelection,
  scrollX,
}: DataTableProps<T>) {
  if (status === 'error') {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  const handleChange: TableProps<T>['onChange'] = (page, _filters, sorter) => {
    if (page.current !== pagination.page || page.pageSize !== pagination.pageSize) {
      pagination.onChange(page.current ?? 1, page.pageSize ?? pagination.pageSize)
    }
    const single = Array.isArray(sorter) ? sorter[0] : sorter
    const next: SortState =
      single?.order && typeof single.field === 'string'
        ? { field: single.field, order: single.order === 'ascend' ? 'asc' : 'desc' }
        : null
    if (JSON.stringify(next) !== JSON.stringify(sort ?? null)) onSortChange?.(next)
  }

  const paginationConfig: TablePaginationConfig = {
    current: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 条`,
  }

  return (
    <div>
      {toolbar ? <div style={{ marginBottom: 16 }}>{toolbar}</div> : null}
      <Table<T>
        columns={applySortOrder(columns, sort)}
        dataSource={status === 'empty' ? [] : rows}
        rowKey={typeof rowKey === 'function' ? rowKey : (rowKey as string)}
        loading={status === 'loading'}
        pagination={paginationConfig}
        onChange={handleChange}
        rowSelection={rowSelection}
        scroll={scrollX ? { x: scrollX } : undefined}
        locale={{
          emptyText: (
            <EmptyState
              title={empty?.title ?? '暂无数据'}
              description={empty?.description}
              action={empty?.action}
            />
          ),
        }}
      />
    </div>
  )
}
