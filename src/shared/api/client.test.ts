import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { server } from '@/test/msw/server'
import type { ApiError } from './errors'
import { request, requestVoid, setToken, setUnauthorizedHandler } from './client'
import { resetDb } from './mock/db'
import { customerSchema, loginResponseSchema } from './schema'

let onUnauthorized: Mock<(error: ApiError) => void>

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  resetDb()
  setToken(null)
  onUnauthorized = vi.fn()
  setUnauthorizedHandler(onUnauthorized)
})
afterEach(() => {
  server.resetHandlers()
  setToken(null)
  setUnauthorizedHandler(null)
})
afterAll(() => server.close())

function createBody() {
  return {
    name: '会话测试客户',
    industry: 'tech',
    level: 'key',
    status: 'active',
    ownerId: 'usr_1',
  }
}

describe('[AUTH-01] 401 会话失效回调', () => {
  it('普通接口 401 调用一次性处理回调', async () => {
    setToken('expired-token')
    const error = await request('/customers', customerSchema, {
      method: 'POST',
      body: createBody(),
    }).catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('requestVoid 的 401 也走同一回调', async () => {
    setToken('expired-token')
    const error = await requestVoid('/customers/cus_001').catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('登录失败 401 不触发会话失效', async () => {
    const error = await request('/auth/login', loginResponseSchema, {
      method: 'POST',
      body: { email: 'admin@example.com', password: 'wrong-password' },
    }).catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('403 不触发会话失效', async () => {
    setToken('mock-viewer-token')
    const error = await request('/customers', customerSchema, {
      method: 'POST',
      body: createBody(),
    }).catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 403, code: 'FORBIDDEN' })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
