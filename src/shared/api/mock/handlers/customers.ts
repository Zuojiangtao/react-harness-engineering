import { http } from 'msw'
import {
  bulkDeleteSchema,
  customerCreateSchema,
  customerFiltersSchema,
  customerSchema,
  customerUpdateSchema,
  pageSchema,
  type Customer,
} from '../../schema'
import { getDb } from '../db'
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

const customerPageSchema = pageSchema(customerSchema)

function sortCustomers(items: Customer[], sort: string): Customer[] {
  const sorted = [...items]
  switch (sort) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    case '-name':
      return sorted.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'))
    case 'createdAt':
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

export const customerHandlers = [
  http.get(`${API_PREFIX}/customers`, async ({ request }) => {
    await mockDelay()
    const params = Object.fromEntries(new URL(request.url).searchParams)
    const parsed = customerFiltersSchema.safeParse(params)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', '筛选参数不合法', { fields: zodFields(parsed.error) })
    }
    const { page, pageSize, keyword, level, status, sort } = parsed.data
    const db = getDb()
    const filtered = db.customers.filter((customer) => {
      if (keyword && !customer.name.includes(keyword)) return false
      if (level && customer.level !== level) return false
      if (status && customer.status !== status) return false
      return true
    })
    const sorted = sortCustomers(filtered, sort)
    const start = (page - 1) * pageSize
    return json(
      customerPageSchema.parse({
        items: sorted.slice(start, start + pageSize),
        total: sorted.length,
        page,
        pageSize,
      }),
    )
  }),

  http.get(`${API_PREFIX}/customers/options`, async ({ request }) => {
    await mockDelay()
    const keyword = new URL(request.url).searchParams.get('keyword')?.trim() ?? ''
    const items = getDb()
      .customers.filter((customer) => (keyword ? customer.name.includes(keyword) : true))
      .slice(0, 20)
      .map((customer) => ({ id: customer.id, name: customer.name, status: customer.status }))
    return json({ items })
  }),

  http.get(`${API_PREFIX}/customers/:id`, async ({ params }) => {
    await mockDelay()
    const customer = getDb().customers.find((item) => item.id === params.id)
    if (!customer) return fail(404, 'NOT_FOUND', '客户不存在')
    return json(customerSchema.parse(customer))
  }),

  http.post(`${API_PREFIX}/customers`, async ({ request }) => {
    await mockDelay()
    const user = currentUser(request)
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const parsed = customerCreateSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return fail(422, 'VALIDATION_ERROR', '表单校验失败', { fields: zodFields(parsed.error) })
    }
    const db = getDb()
    if (!db.members.some((member) => member.id === parsed.data.ownerId)) {
      return fail(422, 'VALIDATION_ERROR', '负责人不存在', {
        fields: { ownerId: '请选择有效的负责人' },
      })
    }
    const now = new Date().toISOString()
    const customer: Customer = {
      id: nextId(
        'cus_',
        db.customers.map((item) => item.id),
      ),
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    }
    db.customers.unshift(customer)
    return json(customerSchema.parse(customer), 201)
  }),

  http.patch(`${API_PREFIX}/customers/:id`, async ({ params, request }) => {
    await mockDelay()
    const user = currentUser(request)
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const db = getDb()
    const index = db.customers.findIndex((item) => item.id === params.id)
    if (index < 0) return fail(404, 'NOT_FOUND', '客户不存在')

    const parsed = customerUpdateSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return fail(422, 'VALIDATION_ERROR', '表单校验失败', { fields: zodFields(parsed.error) })
    }
    const current = db.customers[index]
    if (parsed.data.updatedAt !== current.updatedAt) {
      return fail(409, 'STALE_WRITE', '数据已被其他人修改，请刷新后重试')
    }

    const { updatedAt: _ignored, phone, email, ownerId, ...changes } = parsed.data
    if (ownerId !== undefined && !db.members.some((member) => member.id === ownerId)) {
      return fail(422, 'VALIDATION_ERROR', '负责人不存在', {
        fields: { ownerId: '请选择有效的负责人' },
      })
    }
    const next: Customer = {
      ...current,
      ...changes,
      ...(ownerId !== undefined ? { ownerId } : {}),
      updatedAt: new Date().toISOString(),
    }
    // null / '' 是显式清空；undefined 表示本次 PATCH 没带这个字段。
    if (phone === null || phone === '') delete next.phone
    else if (phone !== undefined) next.phone = phone
    if (email === null || email === '') delete next.email
    else if (email !== undefined) next.email = email
    db.customers[index] = next
    return json(customerSchema.parse(next))
  }),

  http.delete(`${API_PREFIX}/customers/:id`, async ({ params, request }) => {
    await mockDelay()
    const user = currentUser(request)
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const db = getDb()
    const index = db.customers.findIndex((item) => item.id === params.id)
    if (index < 0) return fail(404, 'NOT_FOUND', '客户不存在')

    const orderCount = db.orders.filter((order) => order.customerId === params.id).length
    if (orderCount > 0) {
      return fail(409, 'CUSTOMER_HAS_ORDERS', `该客户有 ${orderCount} 个订单，请先归档或转移`, {
        details: { orderCount },
      })
    }
    db.customers.splice(index, 1)
    return noContent()
  }),

  http.post(`${API_PREFIX}/customers/bulk-delete`, async ({ request }) => {
    await mockDelay()
    const user = currentUser(request)
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const parsed = bulkDeleteSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return fail(422, 'VALIDATION_ERROR', '参数不合法', { fields: zodFields(parsed.error) })
    }
    const db = getDb()
    const deleted: string[] = []
    const failed: Array<{ id: string; code: string }> = []
    for (const id of parsed.data.ids) {
      const index = db.customers.findIndex((item) => item.id === id)
      if (index < 0) {
        failed.push({ id, code: 'NOT_FOUND' })
        continue
      }
      const orderCount = db.orders.filter((order) => order.customerId === id).length
      if (orderCount > 0) {
        failed.push({ id, code: 'CUSTOMER_HAS_ORDERS' })
        continue
      }
      db.customers.splice(index, 1)
      deleted.push(id)
    }
    return json({ deleted, failed }, failed.length ? 207 : 200)
  }),
]
