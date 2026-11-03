import { request, requestVoid } from '@/shared/api/client'
import {
  orderSchema,
  pageSchema,
  type Order,
  type OrderCreate,
  type OrderFilters,
  type OrderUpdate,
} from '@/shared/api/schema'

const orderPageSchema = pageSchema(orderSchema)

export type TransitionTarget = 'paid' | 'cancelled' | 'refunded'

export const ordersApi = {
  list: (filters: OrderFilters, signal?: AbortSignal) =>
    request('/orders', orderPageSchema, { query: filters, signal }),

  get: (id: string) => request(`/orders/${encodeURIComponent(id)}`, orderSchema),

  create: (input: OrderCreate) => request('/orders', orderSchema, { method: 'POST', body: input }),

  update: (id: string, input: OrderUpdate) =>
    request(`/orders/${encodeURIComponent(id)}`, orderSchema, { method: 'PATCH', body: input }),

  remove: (id: string) => requestVoid(`/orders/${encodeURIComponent(id)}`),

  transition: (id: string, to: TransitionTarget) =>
    request(`/orders/${encodeURIComponent(id)}/transition`, orderSchema, {
      method: 'POST',
      body: { to },
    }),
}

export type { Order }
