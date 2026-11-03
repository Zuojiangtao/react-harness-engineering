import { useState } from 'react'
import { Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@/shared/lib/use-debounced-value'
import type { Option } from './types'

export function AsyncSelect({
  value,
  onChange,
  load,
  cacheKey,
  placeholder,
  minChars = 1,
}: {
  value?: string
  onChange?: (value: string | undefined) => void
  load: (keyword: string) => Promise<Option[]>
  cacheKey: string
  placeholder?: string
  minChars?: number
}) {
  const [keyword, setKeyword] = useState('')
  const debounced = useDebouncedValue(keyword, 300)
  const enabled = debounced.trim().length >= minChars

  const { data, isFetching } = useQuery({
    queryKey: ['async-select', cacheKey, debounced],
    queryFn: () => load(debounced),
    enabled,
    staleTime: 30_000,
  })

  return (
    <Select
      showSearch
      allowClear
      value={value}
      placeholder={placeholder}
      filterOption={false}
      loading={isFetching}
      onSearch={setKeyword}
      onChange={onChange}
      options={(data ?? []).map((option) => ({ label: option.label, value: option.value }))}
      notFoundContent={isFetching ? '搜索中…' : '没有匹配结果'}
    />
  )
}
