import { authHandlers } from './auth'
import { customerHandlers } from './customers'
import { memberHandlers } from './members'
import { orderHandlers } from './orders'

export const handlers = [...authHandlers, ...customerHandlers, ...orderHandlers, ...memberHandlers]

/** 契约测试与文档用的端点清单；新增接口必须同步这里 */
export const ENDPOINTS = [
  { method: 'POST', path: '/api/auth/login' },
  { method: 'GET', path: '/api/auth/me' },
  { method: 'POST', path: '/api/auth/logout' },
  { method: 'GET', path: '/api/customers' },
  { method: 'POST', path: '/api/customers' },
  { method: 'GET', path: '/api/customers/:id' },
  { method: 'PATCH', path: '/api/customers/:id' },
  { method: 'DELETE', path: '/api/customers/:id' },
  { method: 'POST', path: '/api/customers/bulk-delete' },
  { method: 'GET', path: '/api/customers/options' },
  { method: 'GET', path: '/api/orders' },
  { method: 'POST', path: '/api/orders' },
  { method: 'GET', path: '/api/orders/:id' },
  { method: 'PATCH', path: '/api/orders/:id' },
  { method: 'DELETE', path: '/api/orders/:id' },
  { method: 'POST', path: '/api/orders/:id/transition' },
  { method: 'GET', path: '/api/members' },
] as const
