import type { z } from 'zod'
import { env } from '@/shared/config/env'
import { toApiError } from './errors'

const TOKEN_KEY = 'crm.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // 隐私模式下 localStorage 不可用，忽略即可
  }
}

export type QueryValue = string | number | boolean | null | undefined

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
}

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${env.VITE_API_BASE_URL}${path}`
  const url = new URL(base, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

/**
 * 唯一的 HTTP 出口。
 * - 非 2xx：归一化为 ApiError
 * - 2xx：用传入的 schema 校验响应，契约漂移在开发期就暴露
 */
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, signal } = options
  const token = getToken()

  const response = await fetch(buildUrl(path, query), {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    throw toApiError(response.status, await parseBody(response))
  }

  if (response.status === 204) {
    return schema.parse(undefined)
  }
  return schema.parse(await parseBody(response))
}

/** 无响应体的写操作（DELETE / logout） */
export async function requestVoid(path: string, options: RequestOptions = {}): Promise<void> {
  const { method = 'DELETE', body, signal } = options
  const token = getToken()
  const response = await fetch(buildUrl(path), {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw toApiError(response.status, await parseBody(response))
  }
}
