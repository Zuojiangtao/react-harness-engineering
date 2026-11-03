import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/shared/api/errors'
import { DataTable } from './DataTable'
import { renderWithProviders } from '@/test/utils'

type Row = { id: string; name: string }

const columns = [{ title: '名称', dataIndex: 'name' }]
const rows: Row[] = [{ id: 'cus_1', name: '远山科技' }]
const pagination = { page: 1, pageSize: 10, total: 1, onChange: () => {} }

describe('DataTable', () => {
  it('ready 时渲染数据行', () => {
    renderWithProviders(
      <DataTable columns={columns} rows={rows} rowKey="id" status="ready" pagination={pagination} />,
    )
    expect(screen.getByText('远山科技')).toBeInTheDocument()
  })

  it('[CUS-05] loading 时不渲染空态', () => {
    const { container } = renderWithProviders(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey="id"
        status="loading"
        pagination={{ ...pagination, total: 0 }}
      />,
    )
    expect(container.querySelector('.ant-spin')).toBeTruthy()
    expect(screen.queryByText('暂无客户')).not.toBeInTheDocument()
  })

  it('empty 时展示空态与行动按钮', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey="id"
        status="empty"
        pagination={{ ...pagination, total: 0 }}
        empty={{ title: '暂无客户', action: <button>新建客户</button> }}
      />,
    )
    expect(screen.getByText('暂无客户')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新建客户' })).toBeInTheDocument()
  })

  it('error 时展示错误与重试', async () => {
    const onRetry = vi.fn()
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey="id"
        status="error"
        error={new ApiError(500, 'INTERNAL', '服务开小差了')}
        onRetry={onRetry}
        pagination={pagination}
      />,
    )
    expect(screen.getByText('服务开小差了')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(1))
  })
})
