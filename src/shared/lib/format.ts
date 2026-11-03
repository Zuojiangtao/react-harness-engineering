import dayjs from 'dayjs'

const currency = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 分 → ¥1,234.56；无效值回落 — */
export function formatCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return '—'
  return currency.format(cents / 100)
}

/** 元（表单输入）→ 分，四舍五入到整数 */
export function yuanToCents(yuan: number | string | null | undefined): number | undefined {
  if (yuan === null || yuan === undefined || yuan === '') return undefined
  const value = typeof yuan === 'string' ? Number(yuan) : yuan
  if (!Number.isFinite(value)) return undefined
  return Math.round(value * 100)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = dayjs(iso)
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : '—'
}

/** 手机号脱敏：138****0001 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  return phone.length === 11 ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone
}
