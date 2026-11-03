import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { resetDb } from '@/shared/api/mock/db'
import { setToken } from '@/shared/api/client'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import CustomerDetailPage from './detail'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => setToken('mock-admin-token'))
afterEach(() => {
  server.resetHandlers()
  resetDb()
  setToken(null)
})
afterAll(() => server.close())

describe('客户详情页', () => {
  it('展示客户信息与关联订单（复用订单表格）', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
      </Routes>,
      { route: '/customers/cus_001' },
    )

    expect(await screen.findByRole('heading', { name: '远山科技' })).toBeInTheDocument()
    expect(await screen.findByText('共 3 条')).toBeInTheDocument()
    expect(screen.getAllByText(/^ORD-\d{8}-\d{4}$/).length).toBe(3)
    expect(screen.getByText('重点跟进客户')).toBeInTheDocument()
  })
})
