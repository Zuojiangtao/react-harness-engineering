import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { server } from '@/test/msw/server'
import { request, requestVoid, setToken } from './client'
import { resetDb } from './mock/db'
import { ENDPOINTS, handlers } from './mock/handlers'
import {
  customerOptionsSchema,
  customerSchema,
  loginResponseSchema,
  meResponseSchema,
  membersResponseSchema,
  orderSchema,
  pageSchema,
} from './schema'

const customerPageSchema = pageSchema(customerSchema)
const orderPageSchema = pageSchema(orderSchema)
const bulkDeleteResultSchema = z.object({
  deleted: z.array(z.string()),
  failed: z.array(z.object({ id: z.string(), code: z.string() })),
})

type ContractCase = {
  name: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  endpoint: { method: string; path: string }
  run: () => Promise<void>
}

const ADMIN_TOKEN = 'mock-admin-token'

const cases: ContractCase[] = [
  {
    name: 'POST /auth/login',
    method: 'POST',
    endpoint: { method: 'POST', path: '/api/auth/login' },
    run: async () => {
      const result = await request('/auth/login', loginResponseSchema, {
        method: 'POST',
        body: { email: 'admin@example.com', password: 'admin123' },
      })
      expect(result.user.role).toBe('admin')
    },
  },
  {
    name: 'GET /auth/me',
    method: 'GET',
    endpoint: { method: 'GET', path: '/api/auth/me' },
    run: async () => {
      setToken(ADMIN_TOKEN)
      const result = await request('/auth/me', meResponseSchema)
      expect(result.user.email).toBe('admin@example.com')
    },
  },
  {
    name: 'POST /auth/logout',
    method: 'POST',
    endpoint: { method: 'POST', path: '/api/auth/logout' },
    run: async () => {
      setToken(ADMIN_TOKEN)
      await expect(requestVoid('/auth/logout', { method: 'POST' })).resolves.toBeUndefined()
    },
  },
  {
    name: 'GET /customers',
    method: 'GET',
    endpoint: { method: 'GET', path: '/api/customers' },
    run: async () => {
      const page = await request('/customers', customerPageSchema)
      expect(page.items.length).toBeGreaterThan(0)
    },
  },
  {
    name: 'POST /customers',
    method: 'POST',
    endpoint: { method: 'POST', path: '/api/customers' },
    run: async () => {
      setToken(ADMIN_TOKEN)
      const created = await request('/customers', customerSchema, {
        method: 'POST',
        body: {
          name: '契约测试客户',
          industry: 'tech',
          level: 'key',
          status: 'active',
          ownerId: 'usr_1',
        },
      })
      expect(created.id).toMatch(/^cus_/)
    },
  },
  {
    name: 'GET /customers/:id',
    method: 'GET',
    endpoint: { method: 'GET', path: '/api/customers/:id' },
    run: async () => {
      const customer = await request('/customers/cus_001', customerSchema)
      expect(customer.name).toBe('远山科技')
    },
  },
  {
    name: 'PATCH /customers/:id',
    method: 'PATCH',
    endpoint: { method: 'PATCH', path: '/api/customers/:id' },
    run: async () => {
      setToken(ADMIN_TOKEN)
      const current = await request('/customers/cus_001', customerSchema)
      const updated = await request('/customers/cus_001', customerSchema, {
        method: 'PATCH',
        body: { name: '远山科技（契约）', updatedAt: current.updatedAt },
      })
      expect(updated.name).toBe('远山科技（契约）')
    },
  },
  {
    name: 'DELETE /customers/:id',
    method: 'DELETE',
    endpoint: { method: 'DELETE', path: '/api/customers/:id' },
    run: async () => {
      setToken(ADMIN_TOKEN)
      await expect(requestVoid('/customers/cus_021')).resolves.toBeUndefined()
      await expect(request('/customers/cus_021', customerSchema)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    },
  },
  {
    name: 'POST /customers/bulk-delete',
    method: 'POST',
    endpoint: { method: 'POST', path: '/api/customers/bulk-delete' },
    run: async () => {
      setToken(ADMIN_TOKEN)
      const result = await request('/customers/bulk-delete', bulkDeleteResultSchema, {
        method: 'POST',
        body: { ids: ['cus_021', 'cus_022'] },
      })
      expect(result.deleted).toEqual(['cus_021', 'cus_022'])
      expect(result.failed).toEqual([])
    },
  },
  {
    name: 'GET /customers/options',
    method: 'GET',
    endpoint: { method: 'GET', path: '/api/customers/options' },
    run: async () => {
      const result = await request('/customers/options', customerOptionsSchema, {
        query: { keyword: '远山' },
      })
      expect(result.items.map((item) => item.name)).toContain('远山科技')
    },
  },
  {
    name: 'GET /orders',
    method: 'GET',
    endpoint: { method: 'GET', path: '/api/orders' },
    run: async () => {
      const page = await request('/orders', orderPageSchema)
      expect(page.items.length).toBeGreaterThan(0)
    },
  },
  {
    name: 'POST /orders',
    method: 'POST',
    endpoint: { method: 'POST', path: '/api/orders' },
    run: async () => {
      setToken(ADMIN_TOKEN)
      const created = await request('/orders', orderSchema, {
        method: 'POST',
        body: { customerId: 'cus_001', amountCents: 1000 },
      })
      expect(created.status).toBe('draft')
    },
  },
  {
    name: 'GET /orders/:id',
    method: 'GET',
    endpoint: { method: 'GET', path: '/api/orders/:id' },
    run: async () => {
      const order = await request('/orders/ord_001', orderSchema)
      expect(order.id).toBe('ord_001')
    },
  },
  {
    name: 'PATCH /orders/:id',
    method: 'PATCH',
    endpoint: { method: 'PATCH', path: '/api/orders/:id' },
    run: async () => {
      setToken(ADMIN_TOKEN)
      const current = await request('/orders/ord_001', orderSchema)
      const updated = await request('/orders/ord_001', orderSchema, {
        method: 'PATCH',
        body: { amountCents: 2000, updatedAt: current.updatedAt },
      })
      expect(updated.amountCents).toBe(2000)
    },
  },
  {
    name: 'DELETE /orders/:id',
    method: 'DELETE',
    endpoint: { method: 'DELETE', path: '/api/orders/:id' },
    run: async () => {
      setToken(ADMIN_TOKEN)
      const created = await request('/orders', orderSchema, {
        method: 'POST',
        body: { customerId: 'cus_001', amountCents: 1000 },
      })
      await expect(requestVoid(`/orders/${created.id}`)).resolves.toBeUndefined()
      await expect(request(`/orders/${created.id}`, orderSchema)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    },
  },
  {
    name: 'POST /orders/:id/transition',
    method: 'POST',
    endpoint: { method: 'POST', path: '/api/orders/:id/transition' },
    run: async () => {
      setToken(ADMIN_TOKEN)
      const updated = await request('/orders/ord_001/transition', orderSchema, {
        method: 'POST',
        body: { to: 'cancelled' },
      })
      expect(updated.status).toBe('cancelled')
    },
  },
  {
    name: 'GET /members',
    method: 'GET',
    endpoint: { method: 'GET', path: '/api/members' },
    run: async () => {
      const result = await request('/members', membersResponseSchema)
      expect(result.items.length).toBeGreaterThan(0)
    },
  },
]

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  resetDb()
  setToken(null)
})
afterEach(() => {
  server.resetHandlers()
  setToken(null)
})
afterAll(() => server.close())

describe('17 个端点契约', () => {
  it('ENDPOINTS 与注册的 handler 数量一致，且每个端点都有请求用例', () => {
    expect(handlers).toHaveLength(17)
    expect(ENDPOINTS).toHaveLength(17)

    const covered = new Set(cases.map((item) => `${item.method} ${item.endpoint.path}`))
    for (const endpoint of ENDPOINTS) {
      expect(covered.has(`${endpoint.method} ${endpoint.path}`)).toBe(true)
    }
    expect(covered.size).toBe(ENDPOINTS.length)
  })

  it.each(cases)('$name 可请求并通过响应 schema', async ({ run }) => {
    await run()
  })
})
