import { describe, expect, it } from 'vitest'
import {
  apiErrorSchema,
  customerCreateSchema,
  customerFiltersSchema,
  orderCreateSchema,
  orderTransitionBodySchema,
  pageSchema,
  customerSchema,
} from './schema'

describe('customerCreateSchema', () => {
  const valid = {
    name: '远山科技',
    industry: 'tech',
    level: 'key',
    status: 'active',
    ownerId: 'usr_1',
  }

  it('接受合法输入', () => {
    expect(customerCreateSchema.safeParse(valid).success).toBe(true)
  })

  it('名称太短时把错误定位到 name', () => {
    const result = customerCreateSchema.safeParse({ ...valid, name: '远' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name'])
    }
  })

  it('空字符串的可选字段被当成未填写', () => {
    const result = customerCreateSchema.safeParse({ ...valid, phone: '', email: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.phone).toBeUndefined()
      expect(result.data.email).toBeUndefined()
    }
  })

  it('手机号格式错误时拒绝', () => {
    expect(customerCreateSchema.safeParse({ ...valid, phone: '12345' }).success).toBe(false)
  })
})

describe('orderCreateSchema', () => {
  const valid = { customerId: 'cus_001', amountCents: 19900 }

  it('金额必须是整数分', () => {
    expect(orderCreateSchema.safeParse({ ...valid, amountCents: 199.5 }).success).toBe(false)
    expect(orderCreateSchema.safeParse({ ...valid, amountCents: 0 }).success).toBe(false)
    expect(orderCreateSchema.safeParse({ ...valid, amountCents: 100_000_001 }).success).toBe(false)
  })

  it('状态流转只接受三个目标值', () => {
    expect(orderTransitionBodySchema.safeParse({ to: 'paid' }).success).toBe(true)
    expect(orderTransitionBodySchema.safeParse({ to: 'draft' }).success).toBe(false)
  })
})

describe('查询参数', () => {
  it('默认值生效且字符串数字被转换', () => {
    const parsed = customerFiltersSchema.parse({ page: '2', pageSize: '20' })
    expect(parsed.page).toBe(2)
    expect(parsed.pageSize).toBe(20)
    expect(parsed.sort).toBe('-createdAt')
  })

  it('非法页码回落失败而不是静默', () => {
    expect(customerFiltersSchema.safeParse({ page: '0' }).success).toBe(false)
  })
})

describe('通用结构', () => {
  it('分页 schema 校验条数与总数', () => {
    const schema = pageSchema(customerSchema)
    const result = schema.safeParse({ items: [], total: 0, page: 1, pageSize: 10 })
    expect(result.success).toBe(true)
  })

  it('错误体必须带合法 code', () => {
    expect(apiErrorSchema.safeParse({ code: 'NOPE', message: 'x' }).success).toBe(false)
    expect(apiErrorSchema.safeParse({ code: 'CONFLICT', message: '冲突' }).success).toBe(true)
  })
})
