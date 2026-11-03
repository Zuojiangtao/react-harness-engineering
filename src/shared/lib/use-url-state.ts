import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ZodType } from 'zod'

export type UrlValue = string | number | boolean | null | undefined

/**
 * 筛选/分页/排序 ↔ URL。
 * - 默认值不写进 URL
 * - 非法参数回落到默认值，而不是白屏
 */
export function useUrlState<T extends Record<string, UrlValue>>(
  schema: ZodType<T>,
  defaults: T,
): [T, (patch: Partial<T>) => void] {
  const [params, setParams] = useSearchParams()
  const key = params.toString()

  const value = useMemo(() => {
    const parsed = schema.safeParse(Object.fromEntries(new URLSearchParams(key)))
    return parsed.success ? parsed.data : defaults
  }, [key, schema, defaults])

  const update = useCallback(
    (patch: Partial<T>) => {
      const next = new URLSearchParams(key)
      const merged = { ...value, ...patch }
      for (const field of Object.keys(merged) as Array<keyof T>) {
        const fieldValue = merged[field]
        if (
          fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === '' ||
          fieldValue === defaults[field]
        ) {
          next.delete(String(field))
        } else {
          next.set(String(field), String(fieldValue))
        }
      }
      setParams(next, { replace: true })
    },
    [key, value, defaults, setParams],
  )

  return [value, update]
}
