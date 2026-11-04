import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import type { OrderFilters } from '@/shared/api/schema'
import { useResourceList } from '@/shared/lib/use-resource-list'
import { ordersApi, type TransitionTarget } from './api'

export function useOrderList(filters: OrderFilters) {
  return useResourceList({
    queryKey: queryKeys.orders.list(filters),
    filters,
    list: ordersApi.list,
  })
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
    mutationFn: ({ id, to }: { id: string; to: TransitionTarget }) => ordersApi.transition(id, to),
    onSuccess: invalidate,
  })

  return { create, update, remove, transition }
}
