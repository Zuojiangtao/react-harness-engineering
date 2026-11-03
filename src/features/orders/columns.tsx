import { Button, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Order } from '@/shared/api/schema'
import { formatDateTime } from '@/shared/lib/format'
import { MoneyText } from '@/shared/ui/money-text/MoneyText'
import {
  FINAL_STATUSES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  TRANSITION_ACTIONS,
  type TransitionAction,
} from './constants'

export function buildOrderColumns(options: {
  canWrite: boolean
  onEdit: (order: Order) => void
  onDelete: (order: Order) => void
  onTransition: (order: Order, action: TransitionAction) => void
}): ColumnsType<Order> {
  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      render: (orderNo: string) => <Typography.Text code>{orderNo}</Typography.Text>,
    },
    {
      title: '客户',
      dataIndex: ['customer', 'name'],
      width: 160,
    },
    {
      title: '金额',
      dataIndex: 'amountCents',
      width: 130,
      align: 'right',
      sorter: true,
      render: (cents: number) => <MoneyText cents={cents} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: Order['status']) => (
        <Tag color={ORDER_STATUS_COLORS[status]}>{ORDER_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150,
      sorter: true,
      render: (value: string) => formatDateTime(value),
    },
  ]

  if (options.canWrite) {
    columns.push({
      title: '操作',
      key: 'actions',
      width: 240,
      fixed: 'right',
      render: (_, order) => {
        const actions = TRANSITION_ACTIONS[order.status]
        const isFinal = FINAL_STATUSES.includes(order.status)
        return (
          <Space size={0} wrap>
            {actions.map((action) => (
              <Button
                key={action.to}
                type="link"
                size="small"
                onClick={() => options.onTransition(order, action)}
              >
                {action.label}
              </Button>
            ))}
            <Button
              type="link"
              size="small"
              disabled={isFinal}
              onClick={() => options.onEdit(order)}
            >
              编辑
            </Button>
            <Button type="link" size="small" danger onClick={() => options.onDelete(order)}>
              删除
            </Button>
          </Space>
        )
      },
    })
  }

  return columns
}
