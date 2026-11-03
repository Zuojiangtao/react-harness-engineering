import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { RequireAuth } from './guard'
import LoginPage from '@/pages/login'
import CustomersPage from '@/pages/customers'
import CustomerDetailPage from '@/pages/customers/detail'
import OrdersPage from '@/pages/orders'
import NotFoundPage from '@/pages/not-found'

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
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },
      { path: 'orders', element: <OrdersPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
