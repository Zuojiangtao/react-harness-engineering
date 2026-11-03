import type { Order } from '@/shared/api/schema'

export const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  draft: '草稿',
  paid: '已收款',
  refunded: '已退款',
  cancelled: '已取消',
}

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const ORDER_STATUS_COLORS: Record<Order['status'], string> = {
  draft: 'default',
  paid: 'green',
  refunded: 'orange',
  cancelled: 'red',
}

export type TransitionAction = { to: 'paid' | 'cancelled' | 'refunded'; label: string }

/** 只暴露当前状态允许的动作，和 mock/服务端的状态机保持一致 */
export const TRANSITION_ACTIONS: Record<Order['status'], TransitionAction[]> = {
  draft: [
    { to: 'paid', label: '确认收款' },
    { to: 'cancelled', label: '取消订单' },
  ],
  paid: [{ to: 'refunded', label: '退款' }],
  refunded: [],
  cancelled: [],
}

export const FINAL_STATUSES: Order['status'][] = ['refunded', 'cancelled']
