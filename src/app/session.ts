import { setToken, setUnauthorizedHandler } from '@/shared/api/client'
import { queryClient } from './query-client'
import { router } from './router'

/**
 * 401 的统一出口：清 token、清 Query 缓存，并保留当前地址跳登录。
 * 退出登录也复用 token 清理，但 redirect 只应该在会话失效时出现。
 */
export function handleUnauthorized(): void {
  setToken(null)
  queryClient.clear()

  const { pathname, search } = router.state.location
  if (pathname === '/login') return

  const redirect = encodeURIComponent(`${pathname}${search}`)
  void router.navigate(`/login?redirect=${redirect}`, { replace: true })
}

export function installUnauthorizedHandler(): void {
  setUnauthorizedHandler(handleUnauthorized)
}
