import { Badge, Button, Space, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Customer } from '@/shared/api/schema'
import { formatDateTime } from '@/shared/lib/format'
import { INDUSTRY_LABELS, LEVEL_LABELS, STATUS_LABELS } from './constants'

export function buildCustomerColumns(options: {
  canWrite: boolean
  memberNames: Record<string, string>
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}): ColumnsType<Customer> {
  const columns: ColumnsType<Customer> = [
    {
      title: '客户名称',
      dataIndex: 'name',
      sorter: true,
      render: (name: string, row) => (
        <div>
          <Link to={`/customers/${row.id}`}>{name}</Link>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {INDUSTRY_LABELS[row.industry]}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      width: 90,
      render: (level: Customer['level']) => (
        <Tag color={level === 'key' ? 'gold' : level === 'normal' ? 'blue' : 'default'}>
          {LEVEL_LABELS[level]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: Customer['status']) => (
        <Badge status={status === 'active' ? 'success' : 'default'} text={STATUS_LABELS[status]} />
      ),
    },
    {
      title: '负责人',
      dataIndex: 'ownerId',
      width: 110,
      render: (ownerId: string) => options.memberNames[ownerId] ?? '—',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
      render: (phone?: string) => phone ?? '—',
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
      width: 120,
      fixed: 'right',
      render: (_, row) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => options.onEdit(row)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => options.onDelete(row)}>
            删除
          </Button>
        </Space>
      ),
    })
  }

  return columns
}
