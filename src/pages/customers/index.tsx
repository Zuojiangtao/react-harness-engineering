import { useMemo, useState } from 'react'
import { App, Button, Drawer, Input, Select, Space } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { isApiError, type ApiError } from '@/shared/api/errors'
import {
  CUSTOMER_DEFAULT_FILTERS,
  customerCreateSchema,
  customerFiltersSchema,
  type Customer,
  type CustomerFilters,
} from '@/shared/api/schema'
import { useCurrentUser } from '@/features/auth/hooks'
import { buildCustomerColumns } from '@/features/customers/columns'
import { customerFields, toEditValues, type CustomerFormValues } from '@/features/customers/form'
import { LEVEL_OPTIONS, STATUS_OPTIONS } from '@/features/customers/constants'
import { useCustomerList, useCustomerMutations, useMembers } from '@/features/customers/hooks'
import { useUrlState } from '@/shared/lib/use-url-state'
import { DataTable, type SortState } from '@/shared/ui/data-table/DataTable'
import { FilterBar } from '@/shared/ui/filter-bar/FilterBar'
import { PageHeader } from '@/shared/ui/page-header/PageHeader'
import { ResourceForm } from '@/shared/ui/resource-form/ResourceForm'

type DrawerState = { mode: 'create' } | { mode: 'edit'; customer: Customer } | null

function sortToState(sort: CustomerFilters['sort']): SortState {
  switch (sort) {
    case 'createdAt':
      return { field: 'createdAt', order: 'asc' }
    case 'name':
      return { field: 'name', order: 'asc' }
    case '-name':
      return { field: 'name', order: 'desc' }
    default:
      return { field: 'createdAt', order: 'desc' }
  }
}

export default function CustomersPage() {
  const { message, modal } = App.useApp()
  const [filters, setFilters] = useUrlState(customerFiltersSchema, CUSTOMER_DEFAULT_FILTERS)
  const { rows, total, status, query } = useCustomerList(filters)
  const { create, update, remove } = useCustomerMutations()
  const { data: members } = useMembers()
  const { data: session } = useCurrentUser()
  const canWrite = session?.user.role === 'admin'

  const [drawer, setDrawer] = useState<DrawerState>(null)

  const memberNames = useMemo(
    () => Object.fromEntries((members?.items ?? []).map((member) => [member.id, member.name])),
    [members],
  )
  const ownerOptions = useMemo(
    () => (members?.items ?? []).map((member) => ({ label: member.name, value: member.id })),
    [members],
  )

  const columns = buildCustomerColumns({
    canWrite,
    memberNames,
    onEdit: (customer) => setDrawer({ mode: 'edit', customer }),
    onDelete: (customer) => confirmDelete(customer),
  })

  function changeFilters(patch: Partial<CustomerFilters>): void {
    setFilters({ ...patch, page: patch.page ?? 1 })
  }

  function resetFilters(): void {
    setFilters({ keyword: undefined, level: undefined, status: undefined, page: 1 })
  }

  function confirmDelete(customer: Customer): void {
    modal.confirm({
      title: '删除客户',
      content: `确定删除「${customer.name}」？该操作不可撤销。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await remove.mutateAsync(customer.id)
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

  async function handleSubmit(values: CustomerFormValues): Promise<void> {
    if (drawer?.mode === 'edit') {
      await update.mutateAsync({
        id: drawer.customer.id,
        input: {
          ...values,
          // 表单清空后 schema 得到 undefined；PATCH 用 null 表达“清空”。
          phone: values.phone ?? null,
          email: values.email ?? null,
          updatedAt: drawer.customer.updatedAt,
        },
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
        title="客户"
        description="维护客户档案，删除前需先处理关联订单"
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
                新建客户
              </Button>
            ) : null}
          </>
        }
      />

      <FilterBar onReset={resetFilters}>
        <Input.Search
          key={filters.keyword ?? 'all'}
          allowClear
          placeholder="搜索客户名称"
          style={{ width: 240 }}
          defaultValue={filters.keyword ?? ''}
          onSearch={(value) => changeFilters({ keyword: value.trim() || undefined, page: 1 })}
        />
        <Select
          allowClear
          placeholder="等级"
          style={{ width: 120 }}
          options={LEVEL_OPTIONS}
          value={filters.level}
          onChange={(value) => changeFilters({ level: value as CustomerFilters['level'] })}
        />
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 130 }}
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(value) => changeFilters({ status: value as CustomerFilters['status'] })}
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
          title: '没有符合条件的客户',
          description: '换个关键词，或清空筛选条件',
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
              ? (`${next.order === 'desc' ? '-' : ''}${next.field}` as CustomerFilters['sort'])
              : '-createdAt',
          })
        }
      />

      <Drawer
        title={drawer?.mode === 'edit' ? '编辑客户' : '新建客户'}
        width={560}
        open={Boolean(drawer)}
        onClose={() => setDrawer(null)}
        destroyOnHidden
        extra={
          <Space>
            {drawer?.mode === 'edit' ? (
              <span style={{ color: 'rgba(0,0,0,0.45)' }}>ID: {drawer.customer.id}</span>
            ) : null}
          </Space>
        }
      >
        {drawer ? (
          <ResourceForm
            key={drawer.mode === 'edit' ? drawer.customer.id : 'create'}
            schema={customerCreateSchema}
            fields={customerFields(ownerOptions)}
            initialValues={drawer.mode === 'edit' ? toEditValues(drawer.customer) : undefined}
            submitText={drawer.mode === 'edit' ? '保存' : '创建'}
            onSubmit={handleSubmit}
            onCancel={() => setDrawer(null)}
          />
        ) : null}
      </Drawer>
    </>
  )
}
