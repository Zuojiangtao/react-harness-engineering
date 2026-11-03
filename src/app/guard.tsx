import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { getToken } from '@/shared/api/client'
import { useCurrentUser } from '@/features/auth/hooks'
import type { ReactNode } from 'react'

function loginPath(location: { pathname: string; search: string }): string {
  const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
  return `/login?redirect=${redirect}`
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { isPending, isError } = useCurrentUser()

  if (!getToken() || isError) {
    return <Navigate to={loginPath(location)} replace />
  }
  if (isPending) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin />
      </div>
    )
  }
  return <>{children}</>
}
