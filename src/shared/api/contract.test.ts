import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/test/msw/server'
import { request, requestVoid, setToken } from './client'
import { isApiError } from './errors'
import { resetDb } from './mock/db'
import {
  customerSchema,
  loginResponseSchema,
  meResponseSchema,
  orderSchema,
  pageSchema,
  type Customer,
  type Order,
} from './schema'

const customerPage = pageSchema(customerSchema)
const orderPage = pageSchema(orderSchema)

async function loginAs(role: 'admin' | 'viewer'): Promise<void> {
  const credentials =
    role === 'admin'
      ? { email: 'admin@example.com', password: 'admin123' }
      : { email: 'viewer@example.com', password: 'viewer123' }
  const result = await request('/auth/login', loginResponseSchema, {
    method: 'POST',
    body: credentials,
  })
  setToken(result.token)
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetDb()
  setToken(null)
})
afterAll(() => server.close())

describe('客户接口', () => {
  it('[CUS-01] 列表返回分页结构，默认 10 条', async () => {
    const page = await request('/customers', customerPage)
    expect(page.total).toBe(24)
    expect(page.items).toHaveLength(10)
    expect(page.page).toBe(1)
  })

  it('关键词与等级筛选生效', async () => {
    const page = await request('/customers', customerPage, {
      query: { keyword: '远山', level: 'key' },
    })
    expect(page.items.every((item) => item.name.includes('远山'))).toBe(true)
  })

  it('未登录写操作返回 401', async () => {
    const error = await request('/customers', customerSchema, {
      method: 'POST',
      body: {
        name: '测试客户',
        industry: 'tech',
        level: 'key',
        status: 'active',
        ownerId: 'usr_1',
      },
    }).catch((caught: unknown) => caught)

    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) {
      expect(error.status).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
    }
  })

  it('[CUS-02] 管理员可以创建客户并出现在列表里', async () => {
    await loginAs('admin')
    const created = await request('/customers', customerSchema, {
      method: 'POST',
      body: {
        name: '测试客户',
        industry: 'tech',
        level: 'key',
        status: 'active',
        ownerId: 'usr_1',
        phone: '',
      },
    })
    expect(created.id).toMatch(/^cus_/)

    const page = await request('/customers', customerPage, { query: { keyword: '测试客户' } })
    expect(page.items.some((item) => item.id === created.id)).toBe(true)
  })

  it('负责人不存在时返回 422 并定位到 ownerId', async () => {
    await loginAs('admin')
    const error = await request('/customers', customerSchema, {
      method: 'POST',
      body: {
        name: '无负责人客户',
        industry: 'tech',
        level: 'key',
        status: 'active',
        ownerId: 'usr_999',
      },
    }).catch((caught: unknown) => caught)

    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) {
      expect(error.status).toBe(422)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.fields?.ownerId).toBeTruthy()
    }
  })

  it('[CUS-03] 更新时 updatedAt 过期返回 409 STALE_WRITE', async () => {
    await loginAs('admin')
    const current = await request('/customers/cus_001', customerSchema)
    const error = await request('/customers/cus_001', customerSchema, {
      method: 'PATCH',
      body: { name: '改名失败', updatedAt: '2000-01-01T00:00:00.000Z' },
    }).catch((caught: unknown) => caught)

    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) {
      expect(error.code).toBe('STALE_WRITE')
    }
    expect(current.updatedAt).not.toBe('2000-01-01T00:00:00.000Z')
  })

  it('[CUS-03] 可以用 null 清空手机号和邮箱', async () => {
    await loginAs('admin')
    const current = await request('/customers/cus_001', customerSchema)
    expect(current.phone).toBeTruthy()
    expect(current.email).toBeTruthy()

    const updated = await request('/customers/cus_001', customerSchema, {
      method: 'PATCH',
      body: { phone: null, email: null, updatedAt: current.updatedAt },
    })
    expect(updated.phone).toBeUndefined()
    expect(updated.email).toBeUndefined()

    const reread = await request('/customers/cus_001', customerSchema)
    expect(reread.phone).toBeUndefined()
    expect(reread.email).toBeUndefined()
  })

  it('[ORD-01] 客户改名后订单里的客户名同步更新', async () => {
    await loginAs('admin')
    const current = await request('/customers/cus_001', customerSchema)
    const renamed = '远山科技（已改名）'

    await request('/customers/cus_001', customerSchema, {
      method: 'PATCH',
      body: { name: renamed, updatedAt: current.updatedAt },
    })

    const page = await request('/orders', orderPage, { query: { customerId: 'cus_001' } })
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((order) => order.customer.name === renamed)).toBe(true)
  })

  it('[CUS-04] 删除有订单的客户返回 409 并带订单数', async () => {
    await loginAs('admin')
    const error = await requestVoid('/customers/cus_001').catch((caught: unknown) => caught)

    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) {
      expect(error.code).toBe('CUSTOMER_HAS_ORDERS')
      expect(error.details?.orderCount).toBe(3)
    }
  })

  it('删除无订单的客户成功', async () => {
    await loginAs('admin')
    await expect(requestVoid('/customers/cus_021')).resolves.toBeUndefined()
    await expect(request('/customers/cus_021', customerSchema)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('[CUS-06] viewer 写操作返回 403', async () => {
    await loginAs('viewer')
    const error = await request('/customers', customerSchema, {
      method: 'POST',
      body: {
        name: '只读客户',
        industry: 'tech',
        level: 'key',
        status: 'active',
        ownerId: 'usr_1',
      },
    }).catch((caught: unknown) => caught)

    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) expect(error.code).toBe('FORBIDDEN')
  })
})

describe('订单接口', () => {
  it('[ORD-01] 按状态筛选只返回该状态，且内联客户名', async () => {
    const page = await request('/orders', orderPage, { query: { status: 'paid' } })
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((order) => order.status === 'paid')).toBe(true)
    expect(page.items[0].customer.name).toBeTruthy()
  })

  it('列表内联客户名，避免每行再查一次', async () => {
    const page = await request('/orders', orderPage)
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items[0].customer.name).toBeTruthy()
  })

  it('[ORD-02] 给已归档客户建单返回 422 CUSTOMER_INACTIVE', async () => {
    await loginAs('admin')
    const error = await request('/orders', orderSchema, {
      method: 'POST',
      body: { customerId: 'cus_004', amountCents: 1000 },
    }).catch((caught: unknown) => caught)

    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) {
      expect(error.status).toBe(422)
      expect(error.fields?.customerId).toBeTruthy()
    }
  })

  it('[ORD-03] 非法状态流转返回 409 INVALID_TRANSITION', async () => {
    await loginAs('admin')
    const before = await request('/orders/ord_001', orderSchema)
    expect(before.status).toBe('draft')

    const error = await request('/orders/ord_001/transition', orderSchema, {
      method: 'POST',
      body: { to: 'refunded' },
    }).catch((caught: unknown) => caught)

    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) expect(error.code).toBe('INVALID_TRANSITION')
  })

  it('[ORD-04] 收款后不可删除', async () => {
    await loginAs('admin')
    const paid = (await request('/orders', orderPage, { query: { status: 'paid' } }))
      .items[0] as Order
    const error = await requestVoid(`/orders/${paid.id}`).catch((caught: unknown) => caught)
    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) expect(error.code).toBe('ORDER_PAID')
  })

  it.each(['ord_003', 'ord_004'])('[ORD-04] 终态订单 %s 不可删除', async (id) => {
    await loginAs('admin')
    const error = await requestVoid(`/orders/${id}`).catch((caught: unknown) => caught)
    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) {
      expect(error.status).toBe(409)
      expect(error.code).toBe('CONFLICT')
    }
    const still = await request(`/orders/${id}`, orderSchema)
    expect(still.id).toBe(id)
  })

  it('删除当天订单后新建不会复用订单号', async () => {
    await loginAs('admin')
    const first = await request('/orders', orderSchema, {
      method: 'POST',
      body: { customerId: 'cus_001', amountCents: 1000 },
    })
    const second = await request('/orders', orderSchema, {
      method: 'POST',
      body: { customerId: 'cus_001', amountCents: 1000 },
    })
    await requestVoid(`/orders/${first.id}`)

    const third = await request('/orders', orderSchema, {
      method: 'POST',
      body: { customerId: 'cus_001', amountCents: 1000 },
    })
    expect(third.orderNo).not.toBe(second.orderNo)
    expect(new Set([first.orderNo, second.orderNo, third.orderNo]).size).toBe(3)

    await requestVoid(`/orders/${third.id}`)
    const fourth = await request('/orders', orderSchema, {
      method: 'POST',
      body: { customerId: 'cus_001', amountCents: 1000 },
    })
    expect(fourth.orderNo).not.toBe(third.orderNo)
  })

  it('创建订单金额按分保存，初始为 draft', async () => {
    await loginAs('admin')
    const created = await request('/orders', orderSchema, {
      method: 'POST',
      body: { customerId: 'cus_001', amountCents: 123456 },
    })
    expect(created.amountCents).toBe(123456)
    expect(created.status).toBe('draft')
    expect(created.orderNo).toMatch(/^ORD-\d{8}-\d{4}$/)
  })

  it('[ORD-05] viewer 创建订单返回 403', async () => {
    await loginAs('viewer')
    const error = await request('/orders', orderSchema, {
      method: 'POST',
      body: { customerId: 'cus_001', amountCents: 1000 },
    }).catch((caught: unknown) => caught)

    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) expect(error.code).toBe('FORBIDDEN')
  })
})

describe('鉴权接口', () => {
  it('[AUTH-01] 登录后可获取当前用户', async () => {
    await loginAs('admin')
    const me = await request('/auth/me', meResponseSchema)
    expect(me.user.email).toBe('admin@example.com')
    expect(me.user.role).toBe('admin')
  })

  it('未登录访问 me 返回 401', async () => {
    const error = await request('/auth/me', meResponseSchema).catch((caught: unknown) => caught)
    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) expect(error.status).toBe(401)
  })

  it('[AUTH-03] 403 之后会话仍然有效', async () => {
    await loginAs('viewer')
    await expect(
      request('/customers', customerSchema, {
        method: 'POST',
        body: {
          name: '只读客户',
          industry: 'tech',
          level: 'key',
          status: 'active',
          ownerId: 'usr_1',
        },
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    const me = await request('/auth/me', meResponseSchema)
    expect(me.user.role).toBe('viewer')
  })
})

describe('错误归一化', () => {
  it('不存在的资源返回 404 且错误体合法', async () => {
    const error = await request('/customers/cus_999', customerSchema).catch(
      (caught: unknown) => caught,
    )
    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) {
      expect(error.status).toBe(404)
      expect(error.message).toBe('客户不存在')
    }
  })
})

// 让 TS 知道 Customer 类型被使用（读模型断言用）
export type ContractCustomer = Customer
