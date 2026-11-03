import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { membersApi } from '@/shared/api/members'
import type { CustomerFilters } from '@/shared/api/schema'
import { useResourceList } from '@/shared/lib/use-resource-list'
import { customersApi } from './api'

export function useCustomerList(filters: CustomerFilters) {
  return useResourceList({
    queryKey: queryKeys.customers.list(filters),
    filters,
    list: customersApi.list,
  })
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
