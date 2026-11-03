import type { Customer } from '@/shared/api/schema'

export const INDUSTRY_LABELS: Record<Customer['industry'], string> = {
  tech: '科技',
  retail: '零售',
  finance: '金融',
  manufacturing: '制造',
  other: '其他',
}

export const LEVEL_LABELS: Record<Customer['level'], string> = {
  key: '重点',
  normal: '普通',
  potential: '潜在',
}

export const STATUS_LABELS: Record<Customer['status'], string> = {
  active: '合作中',
  inactive: '已归档',
}

export const INDUSTRY_OPTIONS = Object.entries(INDUSTRY_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const LEVEL_OPTIONS = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }))

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))
