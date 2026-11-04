import { http } from 'msw'
import {
  orderCreateSchema,
  orderFiltersSchema,
  orderSchema,
  orderTransitionBodySchema,
  orderUpdateSchema,
  pageSchema,
  type Order,
} from '../../schema'
import { getDb, type MockDb } from '../db'
import {
  API_PREFIX,
  currentUser,
  fail,
  forbidden,
  json,
  mockDelay,
  nextId,
  noContent,
  readJson,
  unauthorized,
  zodFields,
} from '../helpers'

const orderPageSchema = pageSchema(orderSchema)

const ALLOWED_TRANSITIONS: Record<Order['status'], Order['status'][]> = {
  draft: ['paid', 'cancelled'],
  paid: ['refunded'],
  refunded: [],
  cancelled: [],
}

function sortOrders(items: Order[], sort: string): Order[] {
  const sorted = [...items]
  switch (sort) {
    case 'createdAt':
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    case 'amountCents':
      return sorted.sort((a, b) => a.amountCents - b.amountCents)
    case '-amountCents':
      return sorted.sort((a, b) => b.amountCents - a.amountCents)
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

function findCustomer(customerId: string) {
  return getDb().customers.find((customer) => customer.id === customerId)
}

/**
 * 按自然日发号：取“已发出的最大值”和“现存订单最大值”中的较大者 + 1。
 * 只数现存订单会在删除后复用号码。
 */
function nextOrderSequence(db: MockDb, day: string): number {
  const prefix = `ORD-${day}-`
  const maxExisting = db.orders.reduce((max, order) => {
    if (!order.orderNo.startsWith(prefix)) return max
    const value = Number(order.orderNo.slice(prefix.length))
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, db.orderSequences[day] ?? 0)

  const next = maxExisting + 1
  db.orderSequences[day] = next
  return next
}

export const orderHandlers = [
  http.get(`${API_PREFIX}/orders`, async ({ request }) => {
    await mockDelay()
    const params = Object.fromEntries(new URL(request.url).searchParams)
    const parsed = orderFiltersSchema.safeParse(params)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', '筛选参数不合法', { fields: zodFields(parsed.error) })
    }
    const { page, pageSize, keyword, status, customerId, sort } = parsed.data
    const filtered = getDb().orders.filter((order) => {
      if (status && order.status !== status) return false
      if (customerId && order.customerId !== customerId) return false
      if (keyword && !`${order.orderNo}${order.customer.name}`.includes(keyword)) return false
      return true
    })
    const sorted = sortOrders(filtered, sort)
    const start = (page - 1) * pageSize
    return json(
      orderPageSchema.parse({
        items: sorted.slice(start, start + pageSize),
        total: sorted.length,
        page,
        pageSize,
      }),
    )
  }),

  http.get(`${API_PREFIX}/orders/:id`, async ({ params }) => {
    await mockDelay()
    const order = getDb().orders.find((item) => item.id === params.id)
    if (!order) return fail(404, 'NOT_FOUND', '订单不存在')
    return json(orderSchema.parse(order))
  }),

  http.post(`${API_PREFIX}/orders`, async ({ request }) => {
    await mockDelay()
    const user = currentUser(request)
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const parsed = orderCreateSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return fail(422, 'VALIDATION_ERROR', '表单校验失败', { fields: zodFields(parsed.error) })
    }
    const customer = findCustomer(parsed.data.customerId)
    if (!customer) {
      return fail(422, 'VALIDATION_ERROR', '客户不存在', { fields: { customerId: '客户不存在' } })
    }
    if (customer.status !== 'active') {
      return fail(422, 'CUSTOMER_INACTIVE', '该客户已归档，不能新建订单', {
        fields: { customerId: '该客户已归档，不能新建订单' },
      })
    }

    const db = getDb()
    const now = new Date().toISOString()
    const day = now.slice(0, 10).replace(/-/g, '')
    const sequence = nextOrderSequence(db, day)
    const order: Order = {
      id: nextId(
        'ord_',
        db.orders.map((item) => item.id),
      ),
      orderNo: `ORD-${day}-${String(sequence).padStart(4, '0')}`,
      customerId: customer.id,
      customer: { id: customer.id, name: customer.name },
      amountCents: parsed.data.amountCents,
      status: 'draft',
      paidAt: null,
      note: parsed.data.note,
      createdAt: now,
      updatedAt: now,
    }
    db.orders.unshift(order)
    return json(orderSchema.parse(order), 201)
  }),

  http.patch(`${API_PREFIX}/orders/:id`, async ({ params, request }) => {
    await mockDelay()
    const user = currentUser(request)
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const db = getDb()
    const index = db.orders.findIndex((item) => item.id === params.id)
    if (index < 0) return fail(404, 'NOT_FOUND', '订单不存在')

    const parsed = orderUpdateSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return fail(422, 'VALIDATION_ERROR', '表单校验失败', { fields: zodFields(parsed.error) })
    }
    const current = db.orders[index]
    if (parsed.data.updatedAt !== current.updatedAt) {
      return fail(409, 'STALE_WRITE', '数据已被其他人修改，请刷新后重试')
    }
    if (current.status === 'refunded' || current.status === 'cancelled') {
      return fail(409, 'CONFLICT', '终态订单不可编辑')
    }

    const { updatedAt: _ignored, customerId, ...changes } = parsed.data
    let customer = current.customer
    if (customerId && customerId !== current.customerId) {
      const target = findCustomer(customerId)
      if (!target) {
        return fail(422, 'VALIDATION_ERROR', '客户不存在', { fields: { customerId: '客户不存在' } })
      }
      if (target.status !== 'active') {
        return fail(422, 'CUSTOMER_INACTIVE', '该客户已归档，不能关联订单', {
          fields: { customerId: '该客户已归档，不能关联订单' },
        })
      }
      customer = { id: target.id, name: target.name }
    }

    const next: Order = {
      ...current,
      ...changes,
      customerId: customer.id,
      customer,
      updatedAt: new Date().toISOString(),
    }
    db.orders[index] = next
    return json(orderSchema.parse(next))
  }),

  http.delete(`${API_PREFIX}/orders/:id`, async ({ params, request }) => {
    await mockDelay()
    const user = currentUser(request)
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const db = getDb()
    const index = db.orders.findIndex((item) => item.id === params.id)
    if (index < 0) return fail(404, 'NOT_FOUND', '订单不存在')
    const status = db.orders[index].status
    if (status === 'paid') {
      return fail(409, 'ORDER_PAID', '已收款订单不可删除，请先退款')
    }
    if (status === 'refunded' || status === 'cancelled') {
      return fail(409, 'CONFLICT', '终态订单不可删除')
    }
    db.orders.splice(index, 1)
    return noContent()
  }),

  http.post(`${API_PREFIX}/orders/:id/transition`, async ({ params, request }) => {
    await mockDelay()
    const user = currentUser(request)
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const parsed = orderTransitionBodySchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return fail(422, 'VALIDATION_ERROR', '状态参数不合法', { fields: zodFields(parsed.error) })
    }
    const db = getDb()
    const index = db.orders.findIndex((item) => item.id === params.id)
    if (index < 0) return fail(404, 'NOT_FOUND', '订单不存在')

    const current = db.orders[index]
    if (!ALLOWED_TRANSITIONS[current.status].includes(parsed.data.to)) {
      return fail(409, 'INVALID_TRANSITION', `订单当前状态（${current.status}）不允许该操作`)
    }
    const now = new Date().toISOString()
    const next: Order = {
      ...current,
      status: parsed.data.to,
      paidAt: parsed.data.to === 'paid' ? now : current.paidAt,
      updatedAt: now,
    }
    db.orders[index] = next
    return json(orderSchema.parse(next))
  }),
]
