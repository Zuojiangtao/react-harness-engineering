import { request, requestVoid } from '@/shared/api/client'
import {
  customerOptionsSchema,
  customerSchema,
  pageSchema,
  type Customer,
  type CustomerCreate,
  type CustomerFilters,
  type CustomerUpdate,
} from '@/shared/api/schema'

const customerPageSchema = pageSchema(customerSchema)

export const customersApi = {
  list: (filters: CustomerFilters, signal?: AbortSignal) =>
    request('/customers', customerPageSchema, { query: filters, signal }),

  get: (id: string) => request(`/customers/${encodeURIComponent(id)}`, customerSchema),

  create: (input: CustomerCreate) =>
    request('/customers', customerSchema, { method: 'POST', body: input }),

  update: (id: string, input: CustomerUpdate) =>
    request(`/customers/${encodeURIComponent(id)}`, customerSchema, {
      method: 'PATCH',
      body: input,
    }),

  remove: (id: string) => requestVoid(`/customers/${encodeURIComponent(id)}`),

  options: async (keyword: string) => {
    const result = await request('/customers/options', customerOptionsSchema, {
      query: { keyword },
    })
    return result.items
  },
}

export type { Customer }
