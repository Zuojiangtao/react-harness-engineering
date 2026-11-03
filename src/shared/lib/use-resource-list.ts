import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Page } from '@/shared/api/schema'

export type ResourceListStatus = 'loading' | 'error' | 'empty' | 'ready'

/**
 * 列表页的编排逻辑：查询、翻页占位、三态推导。
 * 抽象时机：客户与订单两个模块都写完、确认差异之后才抽出（见 ADR 0003）。
 */
export function useResourceList<T, F>(options: {
  queryKey: readonly unknown[]
  filters: F
  list: (filters: F, signal?: AbortSignal) => Promise<Page<T>>
}) {
  const query = useQuery({
    queryKey: options.queryKey,
    queryFn: ({ signal }) => options.list(options.filters, signal),
    placeholderData: keepPreviousData,
  })

  const rows = query.data?.items ?? []
  const status: ResourceListStatus = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : rows.length === 0
        ? 'empty'
        : 'ready'

  return { query, rows, total: query.data?.total ?? 0, status }
}
