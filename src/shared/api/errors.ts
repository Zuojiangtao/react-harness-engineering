import type { z } from 'zod'
import { apiErrorSchema } from './schema'

type ApiErrorBody = z.infer<typeof apiErrorSchema>
export type ApiErrorCode = ApiErrorBody['code']

/** 统一的 API 异常；UI 只依赖这个类型，不关心 HTTP 细节 */
export class ApiError extends Error {
  readonly status: number

  readonly code: ApiErrorCode

  readonly fields?: Record<string, string>

  readonly details?: Record<string, string | number>

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    options: { fields?: Record<string, string>; details?: Record<string, string | number> } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = options.fields
    this.details = options.details
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** 把任意响应体归一化为 ApiError；解析失败回落 INTERNAL，保证 UI 拿到稳定结构 */
export function toApiError(status: number, body: unknown, fallbackMessage = '请求失败'): ApiError {
  const parsed = apiErrorSchema.safeParse(body)
  if (!parsed.success) {
    return new ApiError(status, 'INTERNAL', fallbackMessage)
  }
  const error = parsed.data
  return new ApiError(status, error.code, error.message, {
    fields: error.fields,
    details: error.details,
  })
}
