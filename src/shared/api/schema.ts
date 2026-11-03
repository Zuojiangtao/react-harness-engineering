import { z } from 'zod'

/** ---------- 通用 ---------- */

export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INVALID_TRANSITION',
  'CUSTOMER_HAS_ORDERS',
  'CUSTOMER_INACTIVE',
  'ORDER_PAID',
  'STALE_WRITE',
  'INTERNAL',
] as const

export const apiErrorSchema = z.object({
  code: z.enum(API_ERROR_CODES),
  message: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
  details: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
})

export type ApiErrorBody = z.infer<typeof apiErrorSchema>

export const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number }

const isoDateTime = z.iso.datetime()
const trimmed = z.string().trim()

/** ---------- 客户 ---------- */

export const industrySchema = z.enum(['tech', 'retail', 'finance', 'manufacturing', 'other'])
export const customerLevelSchema = z.enum(['key', 'normal', 'potential'])
export const customerStatusSchema = z.enum(['active', 'inactive'])

const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
const emailSchema = z.email('邮箱格式不正确')

/** 表单里没填的可选字段会提交空字符串，统一在入口转成 undefined */
const emptyToUndefined = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), inner.optional())

export const customerSchema = z.object({
  id: z.string().startsWith('cus_'),
  name: trimmed.min(2, '客户名称至少 2 个字').max(40, '客户名称最多 40 个字'),
  industry: industrySchema,
  level: customerLevelSchema,
  status: customerStatusSchema,
  ownerId: z.string(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  note: trimmed.max(200, '备注最多 200 字').optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
})

export type Customer = z.infer<typeof customerSchema>

export const customerCreateSchema = customerSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    phone: emptyToUndefined(phoneSchema),
    email: emptyToUndefined(emailSchema),
  })

export type CustomerCreate = z.infer<typeof customerCreateSchema>

export const customerUpdateSchema = customerCreateSchema.partial().extend({
  updatedAt: isoDateTime,
})

export type CustomerUpdate = z.infer<typeof customerUpdateSchema>

export const customerFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  keyword: trimmed.max(50).optional(),
  level: customerLevelSchema.optional(),
  status: customerStatusSchema.optional(),
  sort: z.enum(['-createdAt', 'createdAt', 'name', '-name']).default('-createdAt'),
})

export type CustomerFilters = z.infer<typeof customerFiltersSchema>

export const CUSTOMER_DEFAULT_FILTERS: CustomerFilters = {
  page: 1,
  pageSize: 10,
  sort: '-createdAt',
}

export const customerOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: customerStatusSchema,
})

export const customerOptionsSchema = z.object({ items: z.array(customerOptionSchema) })

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().startsWith('cus_')).min(1, '请至少选择一条记录'),
})


/** ---------- 订单 ---------- */

export const orderStatusSchema = z.enum(['draft', 'paid', 'refunded', 'cancelled'])
export const orderTransitionSchema = z.enum(['paid', 'cancelled', 'refunded'])

export const orderSchema = z.object({
  id: z.string().startsWith('ord_'),
  orderNo: z.string().regex(/^ORD-\d{8}-\d{4}$/),
  customerId: z.string().startsWith('cus_'),
  /** 列表读模型：避免前端为每行再查客户 */
  customer: z.object({ id: z.string(), name: z.string() }),
  amountCents: z.number().int().min(1).max(100_000_000),
  status: orderStatusSchema,
  paidAt: isoDateTime.nullable(),
  note: trimmed.max(200, '备注最多 200 字').optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
})

export type Order = z.infer<typeof orderSchema>

export const orderCreateSchema = z.object({
  customerId: z.string().startsWith('cus_'),
  amountCents: z.number().int().min(1).max(100_000_000),
  note: trimmed.max(200, '备注最多 200 字').optional(),
})

export type OrderCreate = z.infer<typeof orderCreateSchema>

/** 不含 status：状态只能走 transition 接口 */
export const orderUpdateSchema = orderCreateSchema.partial().extend({
  updatedAt: isoDateTime,
})

export type OrderUpdate = z.infer<typeof orderUpdateSchema>

export const orderFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  keyword: trimmed.max(50).optional(),
  status: orderStatusSchema.optional(),
  customerId: z.string().optional(),
  sort: z.enum(['-createdAt', 'createdAt', '-amountCents', 'amountCents']).default('-createdAt'),
})

export type OrderFilters = z.infer<typeof orderFiltersSchema>

export const ORDER_DEFAULT_FILTERS: OrderFilters = {
  page: 1,
  pageSize: 10,
  sort: '-createdAt',
}

export const orderTransitionBodySchema = z.object({ to: orderTransitionSchema })

/** ---------- 成员与鉴权 ---------- */

export const roleSchema = z.enum(['admin', 'viewer'])
export type Role = z.infer<typeof roleSchema>

export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: roleSchema,
})

export const membersResponseSchema = z.object({ items: z.array(memberSchema) })

export type Member = z.infer<typeof memberSchema>

export const userSchema = memberSchema.extend({
  email: z.email(),
})

export type User = z.infer<typeof userSchema>

export const loginBodySchema = z.object({
  email: z.email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
})

export const loginResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
})

export type LoginResponse = z.infer<typeof loginResponseSchema>

export const meResponseSchema = z.object({ user: userSchema })
