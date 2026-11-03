import { loadCustomerOptions } from '@/shared/api/customers'
import type { Order } from '@/shared/api/schema'
import type { FieldConfig, Option } from '@/shared/ui/resource-form/types'

export type OrderFormValues = {
  customerId: string
  amountCents: number
  note?: string
}

async function loadCustomers(keyword: string): Promise<Option[]> {
  const items = await loadCustomerOptions(keyword)
  return items.map((customer) => ({
    label: customer.status === 'inactive' ? `${customer.name}（已归档）` : customer.name,
    value: customer.id,
  }))
}

export function orderFields(): FieldConfig<OrderFormValues>[] {
  return [
    {
      kind: 'asyncSelect',
      name: 'customerId',
      label: '客户',
      placeholder: '搜索客户名称',
      required: true,
      load: loadCustomers,
      cacheKey: 'order-customer',
      minChars: 0,
    },
    { kind: 'money', name: 'amountCents', label: '金额', required: true },
    { kind: 'textarea', name: 'note', label: '备注', rows: 3 },
  ]
}

export function toEditValues(order: Order): OrderFormValues {
  return {
    customerId: order.customerId,
    amountCents: order.amountCents,
    note: order.note,
  }
}
