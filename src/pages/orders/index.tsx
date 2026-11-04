import { useState } from 'react'
import { App, Button, Drawer, Input, Select } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { isApiError, type ApiError } from '@/shared/api/errors'
import {
  ORDER_DEFAULT_FILTERS,
  orderCreateSchema,
  orderFiltersSchema,
  type Order,
  type OrderFilters,
} from '@/shared/api/schema'
import { useCurrentUser } from '@/features/auth/hooks'
import { buildOrderColumns } from '@/features/orders/columns'
import { ORDER_STATUS_OPTIONS, type TransitionAction } from '@/features/orders/constants'
import { orderFields, toEditValues, type OrderFormValues } from '@/features/orders/form'
import { useOrderList, useOrderMutations } from '@/features/orders/hooks'
import { useUrlState } from '@/shared/lib/use-url-state'
import { DataTable, type SortState } from '@/shared/ui/data-table/DataTable'
import { FilterBar } from '@/shared/ui/filter-bar/FilterBar'
import { PageHeader } from '@/shared/ui/page-header/PageHeader'
import { ResourceForm } from '@/shared/ui/resource-form/ResourceForm'

type DrawerState = { mode: 'create' } | { mode: 'edit'; order: Order } | null

function sortToState(sort: OrderFilters['sort']): SortState {
  switch (sort) {
    case 'createdAt':
      return { field: 'createdAt', order: 'asc' }
    case 'amountCents':
      return { field: 'amountCents', order: 'asc' }
    case '-amountCents':
      return { field: 'amountCents', order: 'desc' }
    default:
      return { field: 'createdAt', order: 'desc' }
  }
}

export default function OrdersPage() {
  const { message, modal } = App.useApp()
  const [filters, setFilters] = useUrlState(orderFiltersSchema, ORDER_DEFAULT_FILTERS)
  const { rows, total, status, query } = useOrderList(filters)
  const { create, update, remove, transition } = useOrderMutations()
  const { data: session } = useCurrentUser()
  const canWrite = session?.user.role === 'admin'

  const [drawer, setDrawer] = useState<DrawerState>(null)

  const columns = buildOrderColumns({
    canWrite,
    onEdit: (order) => setDrawer({ mode: 'edit', order }),
    onDelete: (order) => confirmDelete(order),
    onTransition: (order, action) => confirmTransition(order, action),
  })

  function changeFilters(patch: Partial<OrderFilters>): void {
    setFilters({ ...patch, page: patch.page ?? 1 })
  }

  function resetFilters(): void {
    setFilters({ keyword: undefined, status: undefined, page: 1 })
  }

  function confirmTransition(order: Order, action: TransitionAction): void {
    modal.confirm({
      title: action.label,
      content: `确定对订单 ${order.orderNo} 执行「${action.label}」？`,
      okText: action.label,
      cancelText: '取消',
      onOk: async () => {
        try {
          await transition.mutateAsync({ id: order.id, to: action.to })
          message.success(`${action.label}成功`)
        } catch (error) {
          message.error(isApiError(error) ? error.message : '操作失败，请稍后重试')
        }
      },
    })
  }

  function confirmDelete(order: Order): void {
    modal.confirm({
      title: '删除订单',
      content: `确定删除订单 ${order.orderNo}？该操作不可撤销。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await remove.mutateAsync(order.id)
          message.success('已删除')
          if (rows.length === 1 && filters.page > 1) {
            setFilters({ page: filters.page - 1 })
          }
        } catch (error) {
          message.error(isApiError(error) ? error.message : '删除失败，请稍后重试')
        }
      },
    })
  }

  async function handleSubmit(values: OrderFormValues): Promise<void> {
    if (drawer?.mode === 'edit') {
      await update.mutateAsync({
        id: drawer.order.id,
        input: { ...values, updatedAt: drawer.order.updatedAt },
      })
      message.success('已保存')
    } else {
      await create.mutateAsync(values)
      message.success('已创建')
    }
    setDrawer(null)
  }

  return (
    <>
      <PageHeader
        title="订单"
        description="订单金额以分为单位存储；状态只能按状态机流转"
        actions={
          <>
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>
              刷新
            </Button>
            {canWrite ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setDrawer({ mode: 'create' })}
              >
                新建订单
              </Button>
            ) : null}
          </>
        }
      />

      <FilterBar onReset={resetFilters}>
        <Input.Search
          key={filters.keyword ?? 'all'}
          allowClear
          placeholder="搜索订单号或客户"
          style={{ width: 240 }}
          defaultValue={filters.keyword ?? ''}
          onSearch={(value) => changeFilters({ keyword: value.trim() || undefined, page: 1 })}
        />
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 130 }}
          options={ORDER_STATUS_OPTIONS}
          value={filters.status}
          onChange={(value) => changeFilters({ status: value as OrderFilters['status'] })}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey="id"
        status={status}
        error={query.error as ApiError | null}
        onRetry={() => void query.refetch()}
        empty={{
          title: '没有符合条件的订单',
          description: '换个状态或关键词试试',
          action: <Button onClick={resetFilters}>清空筛选</Button>,
        }}
        pagination={{
          page: filters.page,
          pageSize: filters.pageSize,
          total,
          onChange: (page, pageSize) => setFilters({ page, pageSize }),
        }}
        sort={sortToState(filters.sort)}
        onSortChange={(next) =>
          setFilters({
            page: 1,
            sort: next
              ? (`${next.order === 'desc' ? '-' : ''}${next.field}` as OrderFilters['sort'])
              : '-createdAt',
          })
        }
      />

      <Drawer
        title={drawer?.mode === 'edit' ? '编辑订单' : '新建订单'}
        size={560}
        open={Boolean(drawer)}
        onClose={() => setDrawer(null)}
        destroyOnHidden
      >
        {drawer ? (
          <ResourceForm
            key={drawer.mode === 'edit' ? drawer.order.id : 'create'}
            schema={orderCreateSchema}
            fields={orderFields()}
            initialValues={drawer.mode === 'edit' ? toEditValues(drawer.order) : undefined}
            submitText={drawer.mode === 'edit' ? '保存' : '创建'}
            onSubmit={handleSubmit}
            onCancel={() => setDrawer(null)}
          />
        ) : null}
      </Drawer>
    </>
  )
}
