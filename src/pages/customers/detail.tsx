import { useMemo, useState } from 'react'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Descriptions, Space, Tag, Typography } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { type ApiError } from '@/shared/api/errors'
import { ORDER_DEFAULT_FILTERS, type OrderFilters } from '@/shared/api/schema'
import { useCustomer, useMembers } from '@/features/customers/hooks'
import { INDUSTRY_LABELS, LEVEL_LABELS, STATUS_LABELS } from '@/features/customers/constants'
import { buildOrderColumns } from '@/features/orders/columns'
import { useOrderList } from '@/features/orders/hooks'
import { formatDateTime } from '@/shared/lib/format'
import { DataTable } from '@/shared/ui/data-table/DataTable'
import { ErrorState } from '@/shared/ui/error-state/ErrorState'
import { PageHeader } from '@/shared/ui/page-header/PageHeader'

const CUSTOMER_ORDERS_PAGE_SIZE = 5

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [orderPage, setOrderPage] = useState(1)

  const customerQuery = useCustomer(id)
  const { data: members } = useMembers()
  const customer = customerQuery.data

  const memberNames = useMemo(
    () => Object.fromEntries((members?.items ?? []).map((member) => [member.id, member.name])),
    [members],
  )

  const orderFilters = useMemo<OrderFilters>(
    () => ({
      ...ORDER_DEFAULT_FILTERS,
      page: orderPage,
      pageSize: CUSTOMER_ORDERS_PAGE_SIZE,
      customerId: id,
    }),
    [id, orderPage],
  )
  const orders = useOrderList(orderFilters)

  const orderColumns = buildOrderColumns({
    canWrite: false,
    onEdit: () => undefined,
    onDelete: () => undefined,
    onTransition: () => undefined,
  })

  if (customerQuery.isError) {
    return (
      <ErrorState
        error={customerQuery.error as ApiError}
        title="客户不存在或加载失败"
        onRetry={() => void customerQuery.refetch()}
      />
    )
  }

  return (
    <>
      <PageHeader
        title={customer?.name ?? '客户详情'}
        description={customer ? `客户 ID：${customer.id}` : undefined}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => void navigate('/customers')}>
            返回列表
          </Button>
        }
      />

      <Card loading={customerQuery.isPending} style={{ marginBottom: 16 }}>
        {customer ? (
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
            <Descriptions.Item label="行业">{INDUSTRY_LABELS[customer.industry]}</Descriptions.Item>
            <Descriptions.Item label="等级">
              <Tag color={customer.level === 'key' ? 'gold' : 'default'}>
                {LEVEL_LABELS[customer.level]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge
                status={customer.status === 'active' ? 'success' : 'default'}
                text={STATUS_LABELS[customer.status]}
              />
            </Descriptions.Item>
            <Descriptions.Item label="负责人">
              {memberNames[customer.ownerId] ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="手机号">{customer.phone ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{customer.email ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(customer.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="备注">{customer.note ?? '—'}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>

      <Space style={{ marginBottom: 12 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          关联订单
        </Typography.Title>
      </Space>

      <DataTable
        columns={orderColumns}
        rows={orders.rows}
        rowKey="id"
        status={orders.status}
        error={orders.query.error as ApiError | null}
        onRetry={() => void orders.query.refetch()}
        empty={{ title: '该客户还没有订单' }}
        pagination={{
          page: orderPage,
          pageSize: CUSTOMER_ORDERS_PAGE_SIZE,
          total: orders.total,
          onChange: (page) => setOrderPage(page),
        }}
      />
    </>
  )
}
