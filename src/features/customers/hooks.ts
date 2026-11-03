import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { membersApi } from '@/shared/api/members'
import type { CustomerFilters } from '@/shared/api/schema'
import { customersApi } from './api'

export function useCustomerList(filters: CustomerFilters) {
  const query = useQuery({
    queryKey: queryKeys.customers.list(filters),
    queryFn: ({ signal }) => customersApi.list(filters, signal),
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

export function useMembers() {
  return useQuery({ queryKey: queryKeys.members, queryFn: membersApi.list, staleTime: 5 * 60_000 })
}

export function useCustomerMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['customers'] })

  const create = useMutation({ mutationFn: customersApi.create, onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof customersApi.update>[1] }) =>
      customersApi.update(id, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: customersApi.remove, onSuccess: invalidate })

  return { create, update, remove }
}
