import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetDb } from '@/shared/api/mock/db'
import { request, setToken } from '@/shared/api/client'
import { orderSchema, pageSchema } from '@/shared/api/schema'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import OrdersPage from './index'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => setToken('mock-admin-token'))
afterEach(() => {
  server.resetHandlers()
  resetDb()
  setToken(null)
})
afterAll(() => server.close())

describe('订单列表页', () => {
  it('加载并展示订单与金额', async () => {
    renderWithProviders(<OrdersPage />, { route: '/orders' })

    expect(await screen.findByText('共 60 条')).toBeInTheDocument()
    expect(screen.getAllByText(/^ORD-\d{8}-\d{4}$/).length).toBeGreaterThan(0)
  })

  it('草稿订单可以确认收款并刷新状态', async () => {
    renderWithProviders(<OrdersPage />, { route: '/orders' })
    const draftTags = await screen.findAllByText('草稿')
    const row = draftTags[0].closest('tr')
    expect(row).not.toBeNull()

    await userEvent.click(within(row as HTMLElement).getByRole('button', { name: '确认收款' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: '确认收款' }))

    expect(await screen.findByText('确认收款成功')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('已收款').length).toBeGreaterThan(0))
  })

  it('新建订单：异步搜索客户并将金额按分提交', async () => {
    renderWithProviders(<OrdersPage />, { route: '/orders' })
    await screen.findByText('共 60 条')

    await userEvent.click(screen.getByRole('button', { name: /新建订单/ }))
    const customer = await screen.findByLabelText('客户')
    await userEvent.click(customer)
    await userEvent.type(customer, '原点')
    await userEvent.click(await screen.findByText('原点设计'))
    fireEvent.change(screen.getByRole('spinbutton', { name: '金额' }), {
      target: { value: '1234.56' },
    })
    await userEvent.click(screen.getByRole('button', { name: /创\s*建/ }))

    expect(await screen.findByText('已创建')).toBeInTheDocument()
    const page = await request('/orders', pageSchema(orderSchema), { query: { pageSize: 100 } })
    expect(page.items.find((order) => order.amountCents === 123456)).toMatchObject({
      customerId: 'cus_024',
      status: 'draft',
    })
  })

  it('删除已收款订单时展示 409 文案', async () => {
    renderWithProviders(<OrdersPage />, { route: '/orders' })
    const paidTags = await screen.findAllByText('已收款')
    const row = paidTags[0].closest('tr')
    expect(row).not.toBeNull()

    await userEvent.click(within(row as HTMLElement).getByRole('button', { name: /删\s*除/ }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /删\s*除/ }))

    expect(await screen.findByText('已收款订单不可删除，请先退款')).toBeInTheDocument()
  })
})
