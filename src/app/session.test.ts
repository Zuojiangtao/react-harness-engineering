import { afterEach, describe, expect, it, vi } from 'vitest'
import { getToken, setToken } from '@/shared/api/client'
import { queryClient } from './query-client'
import { router } from './router'
import { handleUnauthorized } from './session'

describe('[AUTH-01] handleUnauthorized', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setToken(null)
  })

  it('清 token、清缓存，并带 redirect 跳登录', () => {
    setToken('expired-token')
    const clear = vi.spyOn(queryClient, 'clear').mockImplementation(() => undefined)
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(undefined as never)

    handleUnauthorized()

    expect(getToken()).toBeNull()
    expect(clear).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(
      expect.stringMatching(/^\/login\?redirect=/),
      { replace: true },
    )
  })
})
