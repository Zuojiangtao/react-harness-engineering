import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import type { OrderFilters } from '@/shared/api/schema'
import { ordersApi, type TransitionTarget } from './api'

export function useOrderList(filters: OrderFilters) {
  const query = useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: ({ signal }) => ordersApi.list(filters, signal),
    placeholderData: keepPreviousData,
  })

  const rows = query.data?.items ?? []
  const status = query.isPending
    ? ('loading' as const)
    : query.isError
      ? ('error' as const)
      : rows.length === 0
        ? ('empty' as const)
        : ('ready' as const)

  return { query, rows, total: query.data?.total ?? 0, status }
}

export function useOrderMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['orders'] })

  const create = useMutation({ mutationFn: ordersApi.create, onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof ordersApi.update>[1] }) =>
      ordersApi.update(id, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: ordersApi.remove, onSuccess: invalidate })
  const transition = useMutation({
    mutationFn: ({ id, to }: { id: string; to: TransitionTarget }) =>
      ordersApi.transition(id, to),
    onSuccess: invalidate,
  })

  return { create, update, remove, transition }
}
