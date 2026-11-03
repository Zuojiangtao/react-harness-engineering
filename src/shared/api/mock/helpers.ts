import { HttpResponse, delay } from 'msw'
import type { z } from 'zod'
import type { ApiErrorBody, User } from '../schema'
import { env } from '@/shared/config/env'
import { getDb } from './db'

export const API_PREFIX = '*/api'

export function json(data: unknown, status = 200): Response {
  return HttpResponse.json(data as never, { status })
}

export function noContent(): Response {
  return new HttpResponse(null, { status: 204 })
}

export function fail(
  status: number,
  code: ApiErrorBody['code'],
  message: string,
  extra: Pick<ApiErrorBody, 'fields' | 'details'> = {},
): Response {
  return HttpResponse.json({ code, message, ...extra }, { status })
}

export const unauthorized = () => fail(401, 'UNAUTHORIZED', '请先登录')
export const forbidden = () => fail(403, 'FORBIDDEN', '当前角色无权限执行该操作')

export function zodFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || '_'
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

export function tokenFor(user: Pick<User, 'role'>): string {
  return `mock-${user.role}-token`
}

export function currentUser(request: Request): User | null {
  const header = request.headers.get('Authorization')
  const token = header?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const found = getDb().users.find((candidate) => tokenFor(candidate) === token)
  if (!found) return null
  return { id: found.id, name: found.name, role: found.role, email: found.email }
}

/** 浏览器里按配置加延迟让 loading 可见；测试环境不加，保持用例快 */
export async function mockDelay(): Promise<void> {
  const mode = import.meta.env.MODE
  if (mode === 'test') return
  await delay(env.VITE_MOCK_LATENCY_MS)
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function nextId(prefix: string, existing: string[]): string {
  const max = existing.reduce((acc, id) => {
    const value = Number(id.slice(prefix.length))
    return Number.isFinite(value) ? Math.max(acc, value) : acc
  }, 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}
