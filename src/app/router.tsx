import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { RequireAuth } from './guard'
import LoginPage from '@/pages/login'
import NotFoundPage from '@/pages/not-found'

type PageModule = { default: ComponentType }

/** 路由级拆包：页面只在首次访问时加载，登录页保留在首包。 */
function lazyPage(load: () => Promise<PageModule>) {
  return async (): Promise<{ Component: ComponentType }> => ({
    Component: (await load()).default,
  })
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/customers" replace /> },
      { path: 'customers', lazy: lazyPage(() => import('@/pages/customers')) },
      {
        path: 'customers/:id',
        lazy: lazyPage(() => import('@/pages/customers/detail')),
      },
      { path: 'orders', lazy: lazyPage(() => import('@/pages/orders')) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
