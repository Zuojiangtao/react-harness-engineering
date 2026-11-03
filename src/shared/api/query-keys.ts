import type { CustomerFilters, OrderFilters } from '@/shared/api/schema'

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  customers: {
    list: (filters: CustomerFilters) => ['customers', 'list', filters] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
    options: (keyword: string) => ['customers', 'options', keyword] as const,
  },
  orders: {
    list: (filters: OrderFilters) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  members: ['members'] as const,
}
