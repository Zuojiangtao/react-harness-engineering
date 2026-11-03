import type { CustomerCreate } from '@/shared/api/schema'
import type { FieldConfig, Option } from '@/shared/ui/resource-form/types'
import { INDUSTRY_OPTIONS, LEVEL_OPTIONS, STATUS_OPTIONS } from './constants'

export type CustomerFormValues = CustomerCreate

export function customerFields(ownerOptions: Option[]): FieldConfig<CustomerFormValues>[] {
  return [
    {
      kind: 'text',
      name: 'name',
      label: '客户名称',
      placeholder: '例如：远山科技',
      required: true,
    },
    { kind: 'select', name: 'industry', label: '行业', options: INDUSTRY_OPTIONS, required: true },
    { kind: 'select', name: 'level', label: '等级', options: LEVEL_OPTIONS, required: true },
    { kind: 'select', name: 'status', label: '状态', options: STATUS_OPTIONS, required: true },
    {
      kind: 'select',
      name: 'ownerId',
      label: '负责人',
      options: ownerOptions,
      required: true,
      placeholder: '请选择负责人',
    },
    { kind: 'text', name: 'phone', label: '手机号', placeholder: '11 位手机号' },
    { kind: 'text', name: 'email', label: '邮箱' },
    { kind: 'textarea', name: 'note', label: '备注', rows: 3 },
  ]
}

export function toEditValues(customer: {
  name: string
  industry: CustomerFormValues['industry']
  level: CustomerFormValues['level']
  status: CustomerFormValues['status']
  ownerId: string
  phone?: string
  email?: string
  note?: string
}): CustomerFormValues {
  return {
    name: customer.name,
    industry: customer.industry,
    level: customer.level,
    status: customer.status,
    ownerId: customer.ownerId,
    phone: customer.phone,
    email: customer.email,
    note: customer.note,
  }
}
