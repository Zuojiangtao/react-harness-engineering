import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetDb } from '@/shared/api/mock/db'
import { request, setToken } from '@/shared/api/client'
import { customerSchema } from '@/shared/api/schema'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import CustomersPage from './index'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => setToken('mock-admin-token'))
afterEach(() => {
  server.resetHandlers()
  resetDb()
  setToken(null)
})
afterAll(() => server.close())

describe('客户列表页', () => {
  it('加载并展示第一页客户', async () => {
    renderWithProviders(<CustomersPage />, { route: '/customers' })

    expect(await screen.findByText('原点设计')).toBeInTheDocument()
    expect(screen.getByText('共 24 条')).toBeInTheDocument()
  })

  it('编辑时清空手机号和邮箱会保存为空', async () => {
    renderWithProviders(<CustomersPage />, { route: '/customers' })
    const nameCell = await screen.findByText('原点设计')
    const row = nameCell.closest('tr')
    expect(row).not.toBeNull()

    await userEvent.click(within(row as HTMLElement).getByRole('button', { name: /编\s*辑/ }))
    await userEvent.clear(await screen.findByLabelText(/手机号/))
    await userEvent.clear(screen.getByLabelText(/邮箱/))
    await userEvent.click(screen.getByRole('button', { name: /保\s*存/ }))

    expect(await screen.findByText('已保存')).toBeInTheDocument()
    const saved = await request('/customers/cus_024', customerSchema)
    expect(saved.phone).toBeUndefined()
    expect(saved.email).toBeUndefined()
  })

  it('关键词搜索走接口并收敛结果', async () => {
    renderWithProviders(<CustomersPage />, { route: '/customers' })
    await screen.findByText('原点设计')

    await userEvent.type(screen.getByPlaceholderText('搜索客户名称'), '远山{enter}')

    await waitFor(() => expect(screen.getByText('共 1 条')).toBeInTheDocument())
    expect(screen.getByText('远山科技')).toBeInTheDocument()
    expect(screen.queryByText('北辰零售')).not.toBeInTheDocument()
  })

  it('[AUTH-02] 只读角色看不到写操作入口', async () => {
    setToken('mock-viewer-token')
    renderWithProviders(<CustomersPage />, { route: '/customers' })
    await screen.findByText('原点设计')

    expect(screen.queryByRole('button', { name: /新建客户/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /编\s*辑/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /删\s*除/ })).not.toBeInTheDocument()
  })

  it('删除有关联订单的客户时展示 409 文案', async () => {
    renderWithProviders(<CustomersPage />, { route: '/customers' })
    const nameCell = await screen.findByText('启明电子')
    const row = nameCell.closest('tr')
    expect(row).not.toBeNull()

    await userEvent.click(within(row as HTMLElement).getByRole('button', { name: /删\s*除/ }))

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /删\s*除/ }))

    expect(
      await screen.findByText('该客户有 3 个订单，请先归档或转移'),
    ).toBeInTheDocument()
  })
})
